import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { lookupKeyFor, parseCheckoutSelection, resolvePriceId, type Cadence, type PaidPlan } from "@/modules/billing/stripe-prices";

export const runtime = "nodejs";

function parseBody(body: { plan?: string; cadence?: string }): { plan: PaidPlan; cadence: Cadence } | null {
  // Accept either a combined `plan_cadence` value or the two fields separately.
  if (body.plan && body.cadence) return parseCheckoutSelection(`${body.plan}_${body.cadence}`);
  return parseCheckoutSelection(body.plan ?? null);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { plan?: string; cadence?: string };
  const selection = parseBody(body);
  if (!selection) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const subscriptionId = sub?.stripe_subscription_id;
  if (!subscriptionId) return NextResponse.json({ error: "No active subscription" }, { status: 400 });

  const newPriceId = await resolvePriceId(lookupKeyFor(selection.plan, selection.cadence), secretKey);
  if (!newPriceId) return NextResponse.json({ error: "Price not found" }, { status: 500 });

  // Read the current subscription item id to swap its price.
  const getRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${secretKey}` }
  });
  if (!getRes.ok) return NextResponse.json({ error: "Subscription not found" }, { status: 400 });

  const subscription = (await getRes.json()) as { items?: { data?: { id: string }[] } };
  const itemId = subscription.items?.data?.[0]?.id;
  if (!itemId) return NextResponse.json({ error: "Subscription item not found" }, { status: 400 });

  const payload = new URLSearchParams();
  payload.set("items[0][id]", itemId);
  payload.set("items[0][price]", newPriceId);
  payload.set("proration_behavior", "create_prorations");

  const updateRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: payload
  });

  if (!updateRes.ok) {
    const err = (await updateRes.json().catch(() => ({}))) as { error?: { message?: string } };
    return NextResponse.json({ error: err.error?.message ?? "Stripe upgrade failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
