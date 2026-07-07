import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(_request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("stripe_subscription_id, current_period_end, created_at, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!sub?.stripe_subscription_id) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }

  if (sub.status === "canceled" || sub.status === "canceling") {
    return NextResponse.json({ error: "Subscription already cancelled or pending cancellation" }, { status: 400 });
  }

  const subscriptionId = sub.stripe_subscription_id;
  const createdAt = sub.created_at ? new Date(sub.created_at) : null;
  const daysSinceCreation = createdAt
    ? (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    : Infinity;
  const isWithin14Days = daysSinceCreation < 14;

  if (isWithin14Days) {
    // Right of withdrawal: expand latest_invoice to get payment_intent for refund
    const getRes = await fetch(
      `https://api.stripe.com/v1/subscriptions/${subscriptionId}?expand[]=latest_invoice.payment_intent`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );
    if (!getRes.ok) return NextResponse.json({ error: "Subscription not found" }, { status: 400 });

    const stripeSub = (await getRes.json()) as {
      latest_invoice?: { payment_intent?: { id: string; status: string } | null } | null;
    };

    // Cancel immediately
    const cancelRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (!cancelRes.ok) {
      const err = (await cancelRes.json().catch(() => ({}))) as { error?: { message?: string } };
      return NextResponse.json({ error: err.error?.message ?? "Cancel failed" }, { status: 502 });
    }

    // Refund the latest charge if payment succeeded
    const paymentIntent = stripeSub.latest_invoice?.payment_intent;
    if (paymentIntent?.id && paymentIntent.status === "succeeded") {
      await fetch("https://api.stripe.com/v1/refunds", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ payment_intent: paymentIntent.id }).toString(),
      }).catch(() => {
        // Refund failure is non-fatal — support can process it manually
      });
    }

    return NextResponse.json({ ok: true, immediate: true });
  }

  // ≥ 14 days: schedule cancellation at period end
  const updateRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ cancel_at_period_end: "true" }).toString(),
  });

  if (!updateRes.ok) {
    const err = (await updateRes.json().catch(() => ({}))) as { error?: { message?: string } };
    return NextResponse.json({ error: err.error?.message ?? "Cancel failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, immediate: false, periodEnd: sub.current_period_end });
}
