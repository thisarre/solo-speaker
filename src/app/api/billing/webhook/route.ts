import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BillingPlan } from "@/modules/billing/entitlements";
import { sendEmail } from "@/lib/email/send";
import {
  renderStudioConfirmedEmail,
  renderSubscriptionCancelledEmail,
  renderTeamConfirmedEmail,
  type RenderedEmail
} from "@/lib/email/templates";

// Best-effort lifecycle email for a subscriber. Never throws (a failed email must not
// cause Stripe to retry the webhook).
async function emailSubscriber(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  render: (name: string | null) => RenderedEmail
): Promise<void> {
  try {
    const { data } = await admin.auth.admin.getUserById(userId);
    const user = data?.user;
    if (!user?.email) return;
    const { data: profile } = await admin.from("profiles").select("full_name").eq("id", userId).maybeSingle();
    const metaName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
    await sendEmail({ to: user.email, ...render(profile?.full_name ?? metaName) });
  } catch {
    // ignore — email is non-critical
  }
}

export const runtime = "nodejs";

type StripeSubscription = {
  id: string;
  status: string;
  metadata: Record<string, string>;
};

type StripeEvent = {
  type: string;
  data: { object: StripeSubscription };
};

const HANDLED_EVENTS = [
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
];

function planFromSubscriptionId(planId: string): BillingPlan {
  if (planId === "team_monthly" || planId === "team_yearly") return "team";
  if (planId === "studio_monthly" || planId === "studio_yearly") return "studio";
  return "trial";
}

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

  const subscription = data.object;
  const userId = subscription.metadata?.user_id;
  const planId = subscription.metadata?.plan;

  if (!userId) {
    return NextResponse.json({ received: true });
  }

  const admin = createAdminClient();

  if (type === "customer.subscription.created" || type === "customer.subscription.updated") {
    const isActive = subscription.status === "active" || subscription.status === "trialing";
    const billingPlan: BillingPlan = isActive ? planFromSubscriptionId(planId ?? "") : "trial";

    await admin.from("profiles").update({ billing_plan: billingPlan }).eq("id", userId);

    if (billingPlan === "team") {
      await admin.from("teams").upsert({ owner_id: userId }, { onConflict: "owner_id", ignoreDuplicates: true });
    }

    // Confirmation email only on the INITIAL subscription (created), never on every update/renewal.
    if (type === "customer.subscription.created" && isActive) {
      if (billingPlan === "studio") await emailSubscriber(admin, userId, (name) => renderStudioConfirmedEmail({ name }));
      else if (billingPlan === "team") await emailSubscriber(admin, userId, (name) => renderTeamConfirmedEmail({ name }));
    }
  }

  if (type === "customer.subscription.deleted") {
    await admin.from("profiles").update({ billing_plan: "trial" }).eq("id", userId);
    await emailSubscriber(admin, userId, (name) => renderSubscriptionCancelledEmail({ name }));
  }

  return NextResponse.json({ received: true });
}
