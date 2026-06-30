import assert from "node:assert/strict";
import test from "node:test";
import { lookupKeyFor, parseCheckoutSelection, seatsAreValid, resolveSeats, planFromProductMetadata, deriveSubscriptionFields } from "./stripe-prices";

test("each plan+cadence maps to its lookup_key", () => {
  assert.equal(lookupKeyFor("studio", "monthly"), "studio_monthly");
  assert.equal(lookupKeyFor("pro", "yearly"), "pro_yearly");
  assert.equal(lookupKeyFor("team", "yearly"), "team_yearly");
});

test("parseCheckoutSelection accepts valid plan_cadence and rejects junk", () => {
  assert.deepEqual(parseCheckoutSelection("pro_monthly"), { plan: "pro", cadence: "monthly" });
  assert.equal(parseCheckoutSelection("trial_monthly"), null);
  assert.equal(parseCheckoutSelection("pro"), null);
});

test("team requires at least 3 seats; studio/pro are always single-seat", () => {
  assert.equal(seatsAreValid("team", 3), true);
  assert.equal(seatsAreValid("team", 2), false);
  assert.equal(seatsAreValid("studio", 1), true);
  assert.equal(seatsAreValid("pro", 5), false);
});

test("resolveSeats defaults old Team links (no seats param) to 3, never errors", () => {
  assert.deepEqual(resolveSeats("team", null), { seats: 3 });
  assert.deepEqual(resolveSeats("team", ""), { seats: 3 });
  assert.deepEqual(resolveSeats("team", undefined), { seats: 3 });
});

test("resolveSeats rejects an explicit Team seat count below 3", () => {
  assert.deepEqual(resolveSeats("team", "2"), { error: "invalid-seats" });
  assert.deepEqual(resolveSeats("team", "5"), { seats: 5 });
});

test("resolveSeats forces studio/pro to a single seat regardless of the param", () => {
  assert.deepEqual(resolveSeats("studio", "9"), { seats: 1 });
  assert.deepEqual(resolveSeats("pro", null), { seats: 1 });
});

test("planFromProductMetadata maps the product plan metadata, defaulting to trial", () => {
  assert.equal(planFromProductMetadata({ plan: "pro" }), "pro");
  assert.equal(planFromProductMetadata({ plan: "team" }), "team");
  assert.equal(planFromProductMetadata({ plan: "" }), "trial");
  assert.equal(planFromProductMetadata(undefined), "trial");
});

test("deriveSubscriptionFields reads plan from price metadata (not stale subscription metadata)", () => {
  // Studio→Pro upgrade: subscription.metadata.plan is stale ("studio") but the price says "pro".
  const d = deriveSubscriptionFields({
    id: "sub_1",
    status: "active",
    customer: "cus_1",
    metadata: { user_id: "u1", plan: "studio" },
    items: { data: [{ quantity: 1, price: { id: "price_pro", metadata: { plan: "pro" }, recurring: { interval: "month" } } }] },
  });
  assert.equal(d.plan, "pro");
  assert.equal(d.cadence, "monthly");
  assert.equal(d.seats, 1);
  assert.equal(d.stripeCustomerId, "cus_1");
});

test("deriveSubscriptionFields falls back to expanded product metadata when price has no plan", () => {
  const d = deriveSubscriptionFields({
    id: "sub_2",
    status: "active",
    metadata: { plan: "studio" },
    items: { data: [{ quantity: 4, price: { id: "p", recurring: { interval: "year" }, product: { metadata: { plan: "team" } } } }] },
  });
  assert.equal(d.plan, "team");
  assert.equal(d.cadence, "yearly");
  assert.equal(d.seats, 4);
});

test("deriveSubscriptionFields falls back to subscription metadata when no price/product plan", () => {
  const d = deriveSubscriptionFields({
    id: "sub_3",
    status: "active",
    metadata: { plan: "studio" },
    items: { data: [{ price: { id: "p", recurring: { interval: "month" }, product: "prod_unexpanded" } }] },
  });
  assert.equal(d.plan, "studio");
  assert.equal(d.cadence, "monthly");
  assert.equal(d.seats, 1); // default when quantity missing
});

test("deriveSubscriptionFields maps year interval to yearly and defaults to monthly otherwise", () => {
  const yearly = deriveSubscriptionFields({ items: { data: [{ price: { recurring: { interval: "year" }, metadata: { plan: "pro" } } }] } });
  assert.equal(yearly.cadence, "yearly");
  const noInterval = deriveSubscriptionFields({ items: { data: [{ price: { metadata: { plan: "pro" } } }] } });
  assert.equal(noInterval.cadence, "monthly");
});

test("deriveSubscriptionFields converts Unix period seconds to ISO", () => {
  const d = deriveSubscriptionFields({
    metadata: {},
    current_period_start: 1_700_000_000,
    current_period_end: 1_702_592_000,
    items: { data: [{ price: { metadata: { plan: "studio" } } }] },
  });
  assert.equal(d.currentPeriodStart, new Date(1_700_000_000 * 1000).toISOString());
  assert.equal(d.currentPeriodEnd, new Date(1_702_592_000 * 1000).toISOString());
});
