import assert from "node:assert/strict";
import test from "node:test";
import { lookupKeyFor, parseCheckoutSelection, seatsAreValid, resolveSeats, planFromProductMetadata } from "./stripe-prices";

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
