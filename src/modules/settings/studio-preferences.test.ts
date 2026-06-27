import assert from "node:assert/strict";
import test from "node:test";
import { readVoiceProviderPreference, resolvePredictiveWritingPreference, voiceProviderStorageKey } from "./studio-preferences";

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

test("readVoiceProviderPreference migrates legacy realtime preference to deepgram", () => {
  const storage = new Map<string, string>([[voiceProviderStorageKey, "realtime"]]);
  const previousWindow = globalThis.window;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null
      }
    }
  });

  try {
    assert.equal(readVoiceProviderPreference(), "deepgram");
  } finally {
    Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
  }
});
