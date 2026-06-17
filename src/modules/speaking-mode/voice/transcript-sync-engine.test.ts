import assert from "node:assert/strict";
import test from "node:test";
import { resetLockOn } from "./lock-on-controller";
import { buildSpeakingIndex } from "./speaking-index";
import { canApplyTranscriptCorrection } from "./transcript-sync-engine";
import type { SpeakingItem } from "../types";

const indexItems = buildSpeakingIndex([
  { estimatedSeconds: 10, id: "a", kind: "body", sectionId: "s1", sectionIndex: 0, segments: [], text: "Premier passage sur la confiance et le courage." },
  { estimatedSeconds: 10, id: "b", kind: "body", sectionId: "s2", sectionIndex: 1, segments: [], text: "Deuxième passage sur la fidélité et la patience." }
] satisfies SpeakingItem[]);

test("canApplyTranscriptCorrection ignores low confidence", () => {
  const decision = canApplyTranscriptCorrection({
    currentIndex: 0,
    indexItems,
    lockState: resetLockOn(),
    match: { confidence: 0.36, matchedIndex: 0, matchedItemId: "a", matchedText: "confiance courage", matchedWords: ["confiance"], reason: "overlap", sectionId: "s1" },
    providerHealth: "healthy",
    transcript: "premier passage confiance courage"
  });

  assert.equal(decision.canApply, false);
});

test("canApplyTranscriptCorrection applies reliable nearby correction", () => {
  const decision = canApplyTranscriptCorrection({
    currentIndex: 0,
    indexItems,
    lockState: resetLockOn(),
    match: { confidence: 0.82, matchedIndex: 1, matchedItemId: "b", matchedText: "deuxieme passage fidelite patience", matchedWords: ["fidelite"], reason: "ngram", sectionId: "s2" },
    providerHealth: "healthy",
    transcript: "deuxieme passage fidelite patience"
  });

  assert.equal(decision.canApply, true);
});

test("canApplyTranscriptCorrection rejects unusable provider", () => {
  const decision = canApplyTranscriptCorrection({
    currentIndex: 0,
    indexItems,
    lockState: resetLockOn(),
    match: { confidence: 0.9, matchedIndex: 1, matchedItemId: "b", matchedText: "deuxieme passage fidelite patience", matchedWords: ["fidelite"], reason: "ngram", sectionId: "s2" },
    providerHealth: "unusable",
    transcript: "deuxieme passage fidelite patience"
  });

  assert.equal(decision.canApply, false);
});
