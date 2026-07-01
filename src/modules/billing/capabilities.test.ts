import assert from "node:assert/strict";
import test from "node:test";
import { can, sttCapFor, PLAN_CAPABILITIES } from "./capabilities";

test("trial unlocks no premium capability and has the 15-min lifetime STT cap", () => {
  assert.equal(can("trial", "export.branded"), false);
  assert.equal(can("trial", "analytics.rehearsal"), false);
  assert.deepEqual(sttCapFor("trial"), { minutes: 15, basis: "trial_total" });
});

test("studio unlocks nothing premium but gets the 60-min billing-period cap", () => {
  assert.equal(can("studio", "export.branded"), false);
  assert.equal(can("studio", "team.seats"), false);
  assert.deepEqual(sttCapFor("studio"), { minutes: 60, basis: "billing_period" });
});

test("pro unlocks the five future Pro capabilities and a 90-min cap", () => {
  for (const cap of ["export.branded", "analytics.rehearsal", "talk.versions", "talk.multilingual", "share.public"] as const) {
    assert.equal(can("pro", cap), true, cap);
  }
  assert.equal(can("pro", "team.seats"), false);
  assert.deepEqual(sttCapFor("pro"), { minutes: 90, basis: "billing_period" });
});

test("team unlocks all Pro capabilities plus team capabilities", () => {
  assert.equal(can("team", "export.branded"), true);
  assert.equal(can("team", "team.seats"), true);
  assert.equal(can("team", "team.sharedLibrary"), true);
  assert.deepEqual(sttCapFor("team"), { minutes: 90, basis: "billing_period" });
});

test("talk.multilingual is gated to Pro/Team only", () => {
  assert.equal(can("trial", "talk.multilingual"), false);
  assert.equal(can("studio", "talk.multilingual"), false);
  assert.equal(can("pro", "talk.multilingual"), true);
  assert.equal(can("team", "talk.multilingual"), true);
});

test("every plan is present in the matrix", () => {
  assert.deepEqual(Object.keys(PLAN_CAPABILITIES).sort(), ["pro", "studio", "team", "trial"]);
});
