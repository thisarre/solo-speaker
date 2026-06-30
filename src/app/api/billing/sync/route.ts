import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deriveSubscriptionFields, type StripeSubscriptionLike } from "@/modules/billing/stripe-prices";

export const runtime = "nodejs";

const SESSION_ID_PATTERN = /^cs_[a-zA-Z0-9_]+$/;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await request.json() as { sessionId?: string };
  if (!sessionId || !SESSION_ID_PATTERN.test(sessionId)) {
    return NextResponse.json({ error: "Invalid session_id" }, { status: 400 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });

  const res = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${sessionId}?expand[]=subscription&expand[]=subscription.items.data.price`,
    {
      headers: { Authorization: `Bearer ${secretKey}` },
      next: { revalidate: 300 }, // Checkout sessions are immutable once complete
    }
  );

  if (!res.ok) return NextResponse.json({ error: "Stripe session not found" }, { status: 400 });

  const session = await res.json() as {
    client_reference_id?: string;
    subscription?: StripeSubscriptionLike & { status?: string };
  };

  if (session.client_reference_id !== user.id) {
    return NextResponse.json({ error: "Session does not belong to this user" }, { status: 403 });
  }

  const sub = session.subscription;
  const isActive = sub?.status === "active" || sub?.status === "trialing";
  const derived = sub ? deriveSubscriptionFields(sub) : null;
  const billingPlan = isActive && derived ? derived.plan : "trial";

  const admin = createAdminClient();

  // Source-of-truth row (idempotent with the webhook — keyed by user_id).
  // The table CHECK forbids 'trial', so only upsert for a paid plan.
  if (sub && derived && (derived.plan === "studio" || derived.plan === "pro" || derived.plan === "team")) {
    await admin.from("subscriptions").upsert(
      {
        user_id: user.id,
        stripe_customer_id: derived.stripeCustomerId,
        stripe_subscription_id: sub.id ?? null,
        plan: derived.plan,
        cadence: derived.cadence,
        status: sub.status ?? derived.status,
        seats: derived.seats,
        current_period_start: derived.currentPeriodStart,
        current_period_end: derived.currentPeriodEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  }

  await admin.from("profiles").update({ billing_plan: billingPlan }).eq("id", user.id);

  // Auto-create team on upgrade — upsert is idempotent
  if (billingPlan === "team") {
    await admin.from("teams").upsert(
      { owner_id: user.id, max_seats: derived?.seats ?? undefined },
      { onConflict: "owner_id" }
    );
  }

  return NextResponse.json({ billingPlan });
}
