import assert from "node:assert/strict";
import test from "node:test";
import { GRANT_TTL_SECONDS, decideCloudAllowed, decideSessionReuse, applyConfirmation } from "./stt-metering";

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

// Non-régression du contournement de quota trouvé le 26/07/2026 : rejouer un
// sessionId déjà clos (ou celui d'un autre compte) frappait des tokens Deepgram
// sans jamais faire avancer le cap.
test("une session inconnue est fraîche : on frappe et on réserve", () => {
  assert.deepEqual(decideSessionReuse(null, "user-a"), { kind: "fresh" });
});

test("un re-mint en cours de session ne re-réserve pas", () => {
  assert.deepEqual(decideSessionReuse({ user_id: "user-a", status: "reserved" }, "user-a"), { kind: "remint" });
});

test("le sessionId d'un autre compte est refusé (403), même encore réservé", () => {
  const decision = decideSessionReuse({ user_id: "user-b", status: "reserved" }, "user-a");
  assert.equal(decision.kind, "reject");
  assert.equal(decision.kind === "reject" && decision.status, 403);
});

test("rejouer une session close ne peut plus frapper de token gratuit (409)", () => {
  for (const status of ["confirmed", "expired"] as const) {
    const decision = decideSessionReuse({ user_id: "user-a", status }, "user-a");
    assert.equal(decision.kind, "reject", `status ${status} devrait être refusé`);
    assert.equal(decision.kind === "reject" && decision.status, 409);
  }
});
