import type { Cadence, PaidPlan } from "./stripe-prices";

type StripeCheckoutPayloadInput = {
  cancelUrl: string;
  customerEmail?: string | null;
  plan: PaidPlan;
  cadence: Cadence;
  priceId: string;
  seats: number;
  successUrl: string;
  userId: string;
};

export function buildStripeCheckoutPayload(input: StripeCheckoutPayloadInput) {
  const payload = new URLSearchParams();
  payload.set("mode", "subscription");
  payload.set("success_url", input.successUrl);
  payload.set("cancel_url", input.cancelUrl);
  payload.set("line_items[0][price]", input.priceId);
  payload.set("line_items[0][quantity]", String(input.seats));
  payload.set("allow_promotion_codes", "true");
  payload.set("client_reference_id", input.userId);
  payload.set("metadata[user_id]", input.userId);
  payload.set("metadata[plan]", input.plan);
  payload.set("subscription_data[metadata][user_id]", input.userId);
  payload.set("subscription_data[metadata][plan]", input.plan);
  if (input.customerEmail) payload.set("customer_email", input.customerEmail);
  return payload;
}

export function planFromSubscriptionMetadata(metadata: Record<string, string>): import("./entitlements").BillingPlan {
  const planId = metadata["plan"] ?? "";
  if (planId === "team") return "team";
  if (planId === "pro") return "pro";
  if (planId === "studio") return "studio";
  return "trial";
}
