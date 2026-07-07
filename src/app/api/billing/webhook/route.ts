import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deriveSubscriptionFields, type StripeSubscriptionLike } from "@/modules/billing/stripe-prices";
import { getPostHogClient } from "@/lib/posthog-server";
import { sendEmail } from "@/lib/email/send";
import {
  normalizeEmailLocale,
  renderStudioConfirmedEmail,
  renderSubscriptionCancelledEmail,
  renderTeamConfirmedEmail,
  type EmailLocale,
  type RenderedEmail
} from "@/lib/email/templates";

// Best-effort lifecycle email for a subscriber. Never throws (a failed email must not
// cause Stripe to retry the webhook).
async function emailSubscriber(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  render: (name: string | null, locale: EmailLocale) => RenderedEmail
): Promise<void> {
  try {
    const { data } = await admin.auth.admin.getUserById(userId);
    const user = data?.user;
    if (!user?.email) return;
    const { data: profile } = await admin.from("profiles").select("full_name, locale").eq("id", userId).maybeSingle();
    const metaName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
    await sendEmail({ to: user.email, ...render(profile?.full_name ?? metaName, normalizeEmailLocale(profile?.locale)) });
  } catch {
    // ignore — email is non-critical
  }
}

export const runtime = "nodejs";

type StripePrice = {
  id: string;
  metadata?: Record<string, string>;
  recurring?: { interval?: "month" | "year" } | null;
  product?: string | { metadata?: Record<string, string> };
};
type StripeSubscriptionItem = { quantity?: number; price?: StripePrice };
type StripeSubscription = {
  id: string;
  status: string;
  cancel_at_period_end?: boolean;
  customer?: string;
  current_period_start?: number;
  current_period_end?: number;
  metadata: Record<string, string>;
  items?: { data?: StripeSubscriptionItem[] };
};

type StripeInvoice = {
  subscription?: string;
  lines?: { data?: Array<{ period?: { start?: number; end?: number } }> };
};

type StripeEvent = {
  type: string;
  data: { object: StripeSubscription | StripeInvoice };
};

const HANDLED_EVENTS = [
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
];

async function verifyStripeSignature(request: NextRequest, body: string): Promise<boolean> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return false;

  const parts = signature.split(",").reduce<Record<string, string>>((acc, part) => {
    const [key, val] = part.split("=");
    if (key && val) acc[key] = val;
    return acc;
  }, {});

  const timestamp = parts["t"];
  const receivedSig = parts["v1"];
  if (!timestamp || !receivedSig) return false;

  const tolerance = 300;
  const eventTs = parseInt(timestamp, 10);
  const nowTs = Math.floor(Date.now() / 1000);
  if (Math.abs(nowTs - eventTs) > tolerance) return false;

  const signedPayload = `${timestamp}.${body}`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
  const expectedSig = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");

  // Timing-safe comparison to prevent timing attacks
  const expectedBytes = Buffer.from(expectedSig, "hex");
  const receivedBytes = Buffer.from(receivedSig, "hex");
  if (expectedBytes.length !== receivedBytes.length) return false;
  return expectedBytes.equals(receivedBytes) &&
    crypto.subtle !== undefined &&
    expectedSig.length === receivedSig.length &&
    [...expectedSig].every((c, i) => c === receivedSig[i]);
}

export async function POST(request: NextRequest) {
  const body = await request.text();

  const isValid = await verifyStripeSignature(request, body);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(body) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, data } = event;

  // Ignore unhandled event types
  if (!HANDLED_EVENTS.includes(type)) {
    return NextResponse.json({ received: true });
  }

  const admin = createAdminClient();

  // invoice.paid carries an INVOICE (not a subscription). Advance the stored billing
  // period so the STT period_key rotates for the next cycle.
  if (type === "invoice.paid") {
    const invoice = data.object as StripeInvoice;
    const subId = invoice.subscription;
    const period = invoice.lines?.data?.[0]?.period;
    if (subId && period && (period.start != null || period.end != null)) {
      await admin
        .from("subscriptions")
        .update({
          current_period_start: period.start != null ? new Date(period.start * 1000).toISOString() : null,
          current_period_end: period.end != null ? new Date(period.end * 1000).toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subId);
    }
    return NextResponse.json({ received: true });
  }

  const subscription = data.object as StripeSubscription;
  const userId = subscription.metadata?.user_id;

  if (!userId) {
    return NextResponse.json({ received: true });
  }

  const derived = deriveSubscriptionFields(subscription as StripeSubscriptionLike);

  if (type === "customer.subscription.created" || type === "customer.subscription.updated") {
    const isActive = subscription.status === "active" || subscription.status === "trialing";
    // Plan derives from the PRICE (changes on upgrade), not stale subscription.metadata.plan.
    const billingPlan = isActive ? derived.plan : "trial";

    // Source-of-truth row. The table CHECK forbids 'trial', so only upsert for a paid plan.
    if (derived.plan === "studio" || derived.plan === "pro" || derived.plan === "team") {
      await admin.from("subscriptions").upsert(
        {
          user_id: userId,
          stripe_customer_id: derived.stripeCustomerId,
          stripe_subscription_id: subscription.id,
          plan: derived.plan,
          cadence: derived.cadence,
          status: subscription.status,
          seats: derived.seats,
          current_period_start: derived.currentPeriodStart,
          current_period_end: derived.currentPeriodEnd,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    }

    await admin.from("profiles").update({ billing_plan: billingPlan }).eq("id", userId);

    if (billingPlan === "team") {
      await admin.from("teams").upsert(
        { owner_id: userId, max_seats: derived.seats },
        { onConflict: "owner_id" }
      );
    }

    // When cancel_at_period_end is set, mark the DB status as "canceling" so the UI can show the badge.
    // Stripe keeps status "active" until the period ends, so we track this ourselves.
    if (type === "customer.subscription.updated" && subscription.cancel_at_period_end) {
      await admin
        .from("subscriptions")
        .update({ status: "canceling", updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    }

    // Confirmation email only on the INITIAL subscription (created), never on every update/renewal.
    if (type === "customer.subscription.created" && isActive) {
      // Funnel: paid conversion. Segmented by tier (priority: trial → Pro).
      getPostHogClient().capture({ distinctId: userId, event: "checkout_completed", properties: { plan: billingPlan, cadence: derived.cadence } });
      if (billingPlan === "studio") await emailSubscriber(admin, userId, (name, locale) => renderStudioConfirmedEmail({ name, locale }));
      else if (billingPlan === "team") await emailSubscriber(admin, userId, (name, locale) => renderTeamConfirmedEmail({ name, locale }));
    }
  }

  if (type === "customer.subscription.deleted") {
    await admin.from("profiles").update({ billing_plan: "trial" }).eq("id", userId);
    await admin
      .from("subscriptions")
      .update({ status: "canceled", updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    // Revoke the team members' entitlements too: a Team subscription pays for the seats, so when the
    // owner cancels, every member must drop back to trial. Otherwise getActivePlan/can() would keep
    // granting them the team plan (90-min STT cap, Pro/Team capabilities) off a canceled subscription.
    // We downgrade billing_plan but keep team_id, so the membership link survives a possible re-subscribe.
    const { data: team } = await admin.from("teams").select("id").eq("owner_id", userId).maybeSingle();
    if (team) {
      await admin.from("profiles").update({ billing_plan: "trial" }).eq("team_id", team.id);
    }

    await emailSubscriber(admin, userId, (name, locale) => renderSubscriptionCancelledEmail({ name, locale }));
  }

  return NextResponse.json({ received: true });
}
