import assert from "node:assert/strict";
import test from "node:test";
import {
  buildStripeCheckoutPayload,
  getCheckoutPlan,
  getStripePriceId,
  stripeCheckoutPlans
} from "./checkout";

test("getCheckoutPlan maps paid subscriptions to Stripe price environment variables", () => {
  assert.equal(getCheckoutPlan("studio_monthly")?.priceEnv, "STRIPE_PRICE_STUDIO_MONTHLY");
  assert.equal(getCheckoutPlan("studio_yearly")?.priceEnv, "STRIPE_PRICE_STUDIO_YEARLY");
  assert.equal(getCheckoutPlan("team_monthly")?.priceEnv, "STRIPE_PRICE_TEAM_MONTHLY");
  assert.equal(getCheckoutPlan("trial"), null);
});

test("getStripePriceId reads the configured price id for a checkout plan", () => {
  assert.equal(getStripePriceId(stripeCheckoutPlans.studio_yearly, { STRIPE_PRICE_STUDIO_YEARLY: "price_yearly" }), "price_yearly");
  assert.equal(getStripePriceId(stripeCheckoutPlans.team_monthly, { STRIPE_PRICE_TEAM_MONTHLY: "price_team" }), "price_team");
});

test("buildStripeCheckoutPayload creates a subscription checkout payload with the 14-day trial", () => {
  const payload = buildStripeCheckoutPayload({
    cancelUrl: "https://solo.test/fr/pricing",
    customerEmail: "speaker@example.com",
    plan: stripeCheckoutPlans.studio_yearly,
    priceId: "price_yearly",
    successUrl: "https://solo.test/fr/dashboard?checkout=success",
    userId: "user_123"
  });

  assert.equal(payload.get("mode"), "subscription");
  assert.equal(payload.get("line_items[0][price]"), "price_yearly");
  assert.equal(payload.get("line_items[0][quantity]"), "1");
  assert.equal(payload.get("subscription_data[trial_period_days]"), "14");
  assert.equal(payload.get("customer_email"), "speaker@example.com");
  assert.equal(payload.get("client_reference_id"), "user_123");
});
