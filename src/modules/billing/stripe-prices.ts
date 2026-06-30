import type { BillingPlan } from "./entitlements";

export type PaidPlan = "studio" | "pro" | "team";
export type Cadence = "monthly" | "yearly";
export const MIN_TEAM_SEATS = 3;

export function lookupKeyFor(plan: PaidPlan, cadence: Cadence): string {
  return `${plan}_${cadence}`;
}

export function parseCheckoutSelection(value: string | null | undefined): { plan: PaidPlan; cadence: Cadence } | null {
  const m = /^(studio|pro|team)_(monthly|yearly)$/.exec(value ?? "");
  return m ? { plan: m[1] as PaidPlan, cadence: m[2] as Cadence } : null;
}

export function seatsAreValid(plan: PaidPlan, seats: number): boolean {
  if (plan === "team") return Number.isInteger(seats) && seats >= MIN_TEAM_SEATS;
  return seats === 1;
}

// Backward-compat for currently-live Team links that have NO seats param: default to 3 (never error).
// Strict <3 rejection applies ONLY to an explicitly provided value. Studio/Pro are always single-seat.
export function resolveSeats(plan: PaidPlan, rawSeats: string | null | undefined): { seats: number } | { error: "invalid-seats" } {
  if (plan !== "team") return { seats: 1 };
  if (rawSeats == null || rawSeats === "") return { seats: MIN_TEAM_SEATS };
  const n = Number(rawSeats);
  if (!Number.isInteger(n) || n < MIN_TEAM_SEATS) return { error: "invalid-seats" };
  return { seats: n };
}

const priceCache = new Map<string, string>();

export async function resolvePriceId(lookupKey: string, secretKey: string): Promise<string | null> {
  const cached = priceCache.get(lookupKey);
  if (cached) return cached;
  const res = await fetch(`https://api.stripe.com/v1/prices?lookup_keys[]=${encodeURIComponent(lookupKey)}&active=true`, {
    headers: { Authorization: `Bearer ${secretKey}` }
  });
  const json = (await res.json().catch(() => ({}))) as { data?: { id: string }[] };
  const id = json.data?.[0]?.id ?? null;
  if (id) priceCache.set(lookupKey, id);
  return id;
}

export function planFromProductMetadata(metadata: Record<string, string> | undefined): BillingPlan {
  const plan = metadata?.plan;
  return plan === "studio" || plan === "pro" || plan === "team" ? plan : "trial";
}

// --- Subscription field derivation (shared by webhook + checkout-return sync) ---

export type StripePriceLike = {
  id?: string;
  metadata?: Record<string, string>;
  recurring?: { interval?: "month" | "year" } | null;
  product?: string | { metadata?: Record<string, string> } | null;
};

export type StripeSubscriptionLike = {
  id?: string;
  status?: string;
  customer?: string | { id?: string } | null;
  current_period_start?: number | null;
  current_period_end?: number | null;
  metadata?: Record<string, string>;
  items?: {
    data?: Array<{
      quantity?: number | null;
      price?: StripePriceLike | null;
      // Stripe API 2025-03-31+ exposes the period on the item rather than the subscription.
      current_period_start?: number | null;
      current_period_end?: number | null;
    } | null>;
  } | null;
};

export type DerivedSubscriptionFields = {
  plan: BillingPlan;
  cadence: Cadence;
  seats: number;
  status: string;
  stripeCustomerId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
};

function isoFromUnix(seconds: number | null | undefined): string | null {
  return typeof seconds === "number" && Number.isFinite(seconds) ? new Date(seconds * 1000).toISOString() : null;
}

// Derive the plan from the PRICE (which changes on upgrade), not the possibly-stale
// subscription.metadata.plan. Falls back to product metadata, then subscription metadata.
export function deriveSubscriptionFields(subscription: StripeSubscriptionLike): DerivedSubscriptionFields {
  const item = subscription.items?.data?.[0] ?? null;
  const price = item?.price ?? null;

  const pricePlan = price?.metadata?.plan;
  let plan: BillingPlan;
  if (pricePlan === "studio" || pricePlan === "pro" || pricePlan === "team") {
    plan = pricePlan;
  } else if (price?.product && typeof price.product === "object") {
    plan = planFromProductMetadata(price.product.metadata);
  } else {
    plan = planFromSubscriptionMetadataPlan(subscription.metadata ?? {});
  }

  const cadence: Cadence = price?.recurring?.interval === "year" ? "yearly" : "monthly";
  const seats = typeof item?.quantity === "number" && item.quantity > 0 ? item.quantity : 1;

  const customer = subscription.customer;
  const stripeCustomerId =
    typeof customer === "string" ? customer : customer && typeof customer === "object" ? (customer.id ?? null) : null;

  return {
    plan,
    cadence,
    seats,
    status: subscription.status ?? "",
    stripeCustomerId,
    // Prefer the subscription-level period (older API versions); fall back to the item-level
    // period (API 2025-03-31+) so a new subscription isn't stored with a null period.
    currentPeriodStart: isoFromUnix(subscription.current_period_start ?? item?.current_period_start),
    currentPeriodEnd: isoFromUnix(subscription.current_period_end ?? item?.current_period_end),
  };
}

// Local copy of the bare-plan-id mapping (mirrors checkout.planFromSubscriptionMetadata)
// kept here to avoid a circular import between checkout.ts and stripe-prices.ts.
function planFromSubscriptionMetadataPlan(metadata: Record<string, string>): BillingPlan {
  const planId = metadata["plan"] ?? "";
  return planId === "studio" || planId === "pro" || planId === "team" ? planId : "trial";
}
