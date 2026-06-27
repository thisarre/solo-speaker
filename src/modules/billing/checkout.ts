export type StripeCheckoutPlanId = "studio_monthly" | "studio_yearly" | "team_monthly" | "team_yearly";

export type StripeCheckoutPlan = {
  id: StripeCheckoutPlanId;
  priceEnv: "STRIPE_PRICE_STUDIO_MONTHLY" | "STRIPE_PRICE_STUDIO_YEARLY" | "STRIPE_PRICE_TEAM_MONTHLY" | "STRIPE_PRICE_TEAM_YEARLY";
};

export const stripeCheckoutPlans = {
  studio_monthly: {
    id: "studio_monthly",
    priceEnv: "STRIPE_PRICE_STUDIO_MONTHLY"
  },
  studio_yearly: {
    id: "studio_yearly",
    priceEnv: "STRIPE_PRICE_STUDIO_YEARLY"
  },
  team_monthly: {
    id: "team_monthly",
    priceEnv: "STRIPE_PRICE_TEAM_MONTHLY"
  },
  team_yearly: {
    id: "team_yearly",
    priceEnv: "STRIPE_PRICE_TEAM_YEARLY"
  }
} satisfies Record<StripeCheckoutPlanId, StripeCheckoutPlan>;

export function planFromSubscriptionMetadata(metadata: Record<string, string>): import("@/modules/billing/entitlements").BillingPlan {
  const planId = metadata["plan"] ?? "";
  if (planId === "team_monthly" || planId === "team_yearly") return "team";
  if (planId === "studio_monthly" || planId === "studio_yearly") return "studio";
  return "trial";
}

export function getCheckoutPlan(value: FormDataEntryValue | string | null | undefined): StripeCheckoutPlan | null {
  return value === "studio_monthly" || value === "studio_yearly" || value === "team_monthly" || value === "team_yearly"
    ? stripeCheckoutPlans[value]
    : null;
}

export function getStripePriceId(plan: StripeCheckoutPlan, env: Record<string, string | undefined> = process.env) {
  return env[plan.priceEnv]?.trim() || "";
}

type StripeCheckoutPayloadInput = {
  cancelUrl: string;
  customerEmail?: string | null;
  plan: StripeCheckoutPlan;
  priceId: string;
  successUrl: string;
  userId: string;
};

export function buildStripeCheckoutPayload(input: StripeCheckoutPayloadInput) {
  const payload = new URLSearchParams();
  payload.set("mode", "subscription");
  payload.set("success_url", input.successUrl);
  payload.set("cancel_url", input.cancelUrl);
  payload.set("line_items[0][price]", input.priceId);
  payload.set("line_items[0][quantity]", "1");
  payload.set("subscription_data[trial_period_days]", "14");
  payload.set("allow_promotion_codes", "true");
  payload.set("client_reference_id", input.userId);
  payload.set("metadata[user_id]", input.userId);
  payload.set("metadata[plan]", input.plan.id);
  payload.set("subscription_data[metadata][user_id]", input.userId);
  payload.set("subscription_data[metadata][plan]", input.plan.id);

  if (input.customerEmail) {
    payload.set("customer_email", input.customerEmail);
  }

  return payload;
}
