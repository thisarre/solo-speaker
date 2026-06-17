import assert from "node:assert/strict";
import test from "node:test";
import { getVoicePacedScrollSpeed } from "./voice-paced-scroll";

test("getVoicePacedScrollSpeed advances while speaking", () => {
  assert.equal(getVoicePacedScrollSpeed({ basePxPerSecond: 20, isAtEnd: false, isPaused: false, userSpeedMultiplier: 1.5, voiceStatus: "speaking" }), 30);
});

test("getVoicePacedScrollSpeed nearly stops while silent", () => {
  assert.equal(getVoicePacedScrollSpeed({ basePxPerSecond: 20, isAtEnd: false, isPaused: false, userSpeedMultiplier: 1, voiceStatus: "silent" }), 1);
});

test("getVoicePacedScrollSpeed stops when paused", () => {
  assert.equal(getVoicePacedScrollSpeed({ basePxPerSecond: 20, isAtEnd: false, isPaused: true, userSpeedMultiplier: 1, voiceStatus: "speaking" }), 0);
});
