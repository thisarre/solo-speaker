import assert from "node:assert/strict";
import test from "node:test";
import { buildSpeakingIndex } from "./speaking-index";
import { evaluateTranscriptQuality } from "./transcript-quality";
import type { SpeakingItem } from "../types";

const items = buildSpeakingIndex([
  { estimatedSeconds: 10, id: "a", kind: "body", sectionId: "s1", sectionIndex: 0, segments: [], text: "Bonjour nous parlons de courage et de fidélité dans cette introduction." }
] satisfies SpeakingItem[]);

test("evaluateTranscriptQuality rejects short transcripts", () => {
  assert.equal(evaluateTranscriptQuality({ indexItems: items, transcript: "bonjour courage" }).isUsable, false);
});

test("evaluateTranscriptQuality accepts useful talk words", () => {
  const quality = evaluateTranscriptQuality({ indexItems: items, transcript: "bonjour nous parlons courage fidelite introduction" });
  assert.equal(quality.isUsable, true);
});
