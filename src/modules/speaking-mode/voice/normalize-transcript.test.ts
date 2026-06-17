import assert from "node:assert/strict";
import test from "node:test";
import { normalizeTranscript, transcriptTokens } from "./normalize-transcript";

test("normalizeTranscript lowercases, removes accents and punctuation", () => {
  assert.equal(normalizeTranscript("Écoutez: l'idée arrive, maintenant !"), "ecoutez l idee arrive maintenant");
});

test("normalizeTranscript collapses whitespace", () => {
  assert.equal(normalizeTranscript("  Une   phrase\navec\t des espaces  "), "une phrase avec des espaces");
});

test("transcriptTokens removes short filler tokens", () => {
  assert.deepEqual(transcriptTokens("Je vais à la conférence maintenant"), ["vais", "conference", "maintenant"]);
});
