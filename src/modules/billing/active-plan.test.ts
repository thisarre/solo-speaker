import assert from "node:assert/strict";
import test from "node:test";
import { resolvePeriodKey, capSecondsFor } from "./active-plan";

test("trial period_key is the constant 'trial' (never resets)", () => {
  assert.equal(resolvePeriodKey("trial", null), "trial");
});

test("paid period_key anchors on the subscription id + period start epoch", () => {
  // 2026-06-01T00:00:00Z === 1780272000 (epoch seconds)
  const key = resolvePeriodKey("studio", { stripe_subscription_id: "sub_X", current_period_start: "2026-06-01T00:00:00.000Z" });
  assert.equal(key, "sub:sub_X:1780272000");
});

test("paid period_key with no subscription row falls back to a stable 'pending' bucket", () => {
  assert.equal(resolvePeriodKey("studio", null), "pending");
});

test("cap is converted from minutes to seconds via the matrix", () => {
  assert.equal(capSecondsFor("trial"), 15 * 60);
  assert.equal(capSecondsFor("studio"), 60 * 60);
  assert.equal(capSecondsFor("pro"), 90 * 60);
  assert.equal(capSecondsFor("team"), 90 * 60);
});
