import assert from "node:assert/strict";
import test from "node:test";
import { buildStripeCheckoutPayload, planFromSubscriptionMetadata } from "./checkout";

test("buildStripeCheckoutPayload builds a subscription checkout WITHOUT a Stripe trial", () => {
  const payload = buildStripeCheckoutPayload({
    cancelUrl: "https://solo.test/fr/pricing",
    customerEmail: "speaker@example.com",
    plan: "pro",
    cadence: "yearly",
    priceId: "price_pro_yearly",
    seats: 1,
    successUrl: "https://solo.test/fr/dashboard?checkout=success",
    userId: "user_123"
  });
  assert.equal(payload.get("mode"), "subscription");
  assert.equal(payload.get("line_items[0][price]"), "price_pro_yearly");
  assert.equal(payload.get("line_items[0][quantity]"), "1");
  assert.equal(payload.get("subscription_data[trial_period_days]"), null);
  assert.equal(payload.get("metadata[plan]"), "pro");
});

test("team checkout carries the seat quantity", () => {
  const payload = buildStripeCheckoutPayload({
    cancelUrl: "c", plan: "team", cadence: "yearly", priceId: "price_team_yearly", seats: 4, successUrl: "s", userId: "u"
  });
  assert.equal(payload.get("line_items[0][quantity]"), "4");
});

test("planFromSubscriptionMetadata maps the new plan ids", () => {
  assert.equal(planFromSubscriptionMetadata({ plan: "pro" }), "pro");
  assert.equal(planFromSubscriptionMetadata({ plan: "team" }), "team");
  assert.equal(planFromSubscriptionMetadata({ plan: "" }), "trial");
});
