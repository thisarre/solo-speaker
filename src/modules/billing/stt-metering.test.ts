import assert from "node:assert/strict";
import test from "node:test";
import { GRANT_TTL_SECONDS, decideCloudAllowed, applyConfirmation } from "./stt-metering";

test("cloud is refused once reserved+confirmed reaches the cap", () => {
  const cap = 60 * 60;
  assert.equal(decideCloudAllowed({ capSeconds: cap, cloudReserved: 0, cloudConfirmed: 0 }), true);
  assert.equal(decideCloudAllowed({ capSeconds: cap, cloudReserved: cap - 1, cloudConfirmed: 0 }), true);
  assert.equal(decideCloudAllowed({ capSeconds: cap, cloudReserved: cap, cloudConfirmed: 0 }), false);
  assert.equal(decideCloudAllowed({ capSeconds: cap, cloudReserved: 30, cloudConfirmed: cap - 30 }), false);
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
