import assert from "node:assert/strict";
import test from "node:test";
import { decideLockOn, resetLockOn } from "./lock-on-controller";

test("decideLockOn accepts a strong first match", () => {
  const decision = decideLockOn(resetLockOn(), {
    confidence: 0.82,
    matchedIndex: 2,
    matchedItemId: "item-2",
    matchedText: "bonjour",
    matchedWords: ["bonjour"],
    reason: "ngram",
    sectionId: "s1"
  });

  assert.equal(decision.accepted, true);
  assert.equal(decision.lockedItemId, "item-2");
});

test("decideLockOn blocks an unconfirmed large jump", () => {
  const state = { ...resetLockOn(), lockedIndex: 2, lockedItemId: "item-2" };
  const decision = decideLockOn(state, {
    confidence: 0.62,
    matchedIndex: 20,
    matchedItemId: "item-20",
    matchedText: "autre passage",
    matchedWords: ["passage"],
    reason: "overlap",
    sectionId: "s5"
  });

  assert.equal(decision.accepted, false);
  assert.equal(decision.lockedItemId, "item-2");
});
