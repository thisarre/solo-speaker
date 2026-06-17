import assert from "node:assert/strict";
import test from "node:test";
import { buildSpeakingIndex } from "./speaking-index";
import type { SpeakingItem } from "../types";

test("buildSpeakingIndex stores normalized text, ngrams and approximate word positions", () => {
  const index = buildSpeakingIndex([
    { estimatedSeconds: 10, id: "one", kind: "body", sectionId: "s1", sectionIndex: 0, segments: [], text: "Bonjour à tous pour cette introduction" },
    { estimatedSeconds: 10, id: "two", kind: "body", sectionId: "s2", sectionIndex: 1, segments: [], text: "Voici la deuxième partie" }
  ] satisfies SpeakingItem[]);

  assert.equal(index[0].id, "one");
  assert.equal(index[0].normalizedText, "bonjour a tous pour cette introduction");
  assert.ok(index[0].phraseNgrams.includes("bonjour tous"));
  assert.equal(index[1].startWordApprox, index[0].endWordApprox);
});
