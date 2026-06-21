import assert from "node:assert/strict";
import test from "node:test";
import { resolvePredictiveWritingPreference } from "./studio-preferences";

test("enabling predictive writing also enables the assistant", () => {
  assert.deepEqual(resolvePredictiveWritingPreference({ aiEnabled: false, predictiveWritingEnabled: false }, true), {
    aiEnabled: true,
    predictiveWritingEnabled: true
  });
});

test("disabling predictive writing keeps the assistant state unchanged", () => {
  assert.deepEqual(resolvePredictiveWritingPreference({ aiEnabled: true, predictiveWritingEnabled: true }, false), {
    aiEnabled: true,
    predictiveWritingEnabled: false
  });
});
