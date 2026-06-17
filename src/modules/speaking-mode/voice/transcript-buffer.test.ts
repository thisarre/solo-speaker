import assert from "node:assert/strict";
import test from "node:test";
import { mergeTranscriptBuffer } from "./transcript-buffer";

test("mergeTranscriptBuffer keeps only recent useful words", () => {
  const buffer = mergeTranscriptBuffer({
    finalTranscript: "un deux trois quatre cinq six sept huit neuf dix onze douze treize",
    interimTranscript: "quatorze quinze"
  });

  assert.equal(buffer.wordCount, 12);
  assert.ok(buffer.recentText.includes("quinze"));
  assert.ok(!buffer.recentText.includes("deux"));
});

test("mergeTranscriptBuffer exposes freshness metadata", () => {
  const buffer = mergeTranscriptBuffer({
    finalTranscript: "bonjour tout le monde",
    interimTranscript: "nous avançons"
  });

  assert.equal(buffer.isFresh, true);
  assert.ok(buffer.lastDeltaAt > 0);
});
