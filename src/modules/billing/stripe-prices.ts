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
