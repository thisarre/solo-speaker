import assert from "node:assert/strict";
import test from "node:test";
import { GRANT_TTL_SECONDS, decideCloudAllowed, applyConfirmation } from "./stt-metering";

test("cloud is allowed only if the expected session fits the remaining budget", () => {
  const cap = 900;
  assert.equal(decideCloudAllowed({ capSeconds: cap, cloudReserved: 0, cloudConfirmed: 0, expectedSeconds: 600 }), true);
  assert.equal(decideCloudAllowed({ capSeconds: cap, cloudReserved: 0, cloudConfirmed: 0, expectedSeconds: 1200 }), false); // long talk blocked up front
  assert.equal(decideCloudAllowed({ capSeconds: cap, cloudReserved: 0, cloudConfirmed: 840, expectedSeconds: 300 }), false); // won't fit remaining budget
  assert.equal(decideCloudAllowed({ capSeconds: cap, cloudReserved: 0, cloudConfirmed: 300, expectedSeconds: 600 }), true); // exactly fits
});

test("confirmation replaces the reservation with the real figure (delta math)", () => {
  const next = applyConfirmation({ cloudReserved: 120, cloudConfirmed: 0 }, { reservedSeconds: 120, confirmedSeconds: 35 });
  assert.deepEqual(next, { cloudReserved: 0, cloudConfirmed: 35 });
});

test("confirmation never drives the reserved counter negative", () => {
  const next = applyConfirmation({ cloudReserved: 60, cloudConfirmed: 10 }, { reservedSeconds: 120, confirmedSeconds: 35 });
  assert.equal(next.cloudReserved, 0);
  assert.equal(next.cloudConfirmed, 45);
});

test("grant TTL is the per-mint reservation block", () => {
  assert.equal(GRANT_TTL_SECONDS, 60);
});
