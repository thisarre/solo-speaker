import assert from "node:assert/strict";
import test from "node:test";
import { buildDeepgramListenUrl, parseDeepgramLiveMessage } from "./deepgram-provider";

test("buildDeepgramListenUrl configures production live transcription", () => {
  assert.equal(
    buildDeepgramListenUrl("FR", "nova-3"),
    "wss://api.deepgram.com/v1/listen?model=nova-3&language=fr&interim_results=true&endpointing=350&punctuate=true&smart_format=true"
  );
});

test("parseDeepgramLiveMessage reads interim and final transcripts", () => {
  const interim = parseDeepgramLiveMessage({
    type: "Results",
    is_final: false,
    channel: { alternatives: [{ transcript: "bonjour tout le monde" }] }
  });
  const final = parseDeepgramLiveMessage({
    type: "Results",
    is_final: true,
    speech_final: true,
    channel: { alternatives: [{ transcript: "bonjour tout le monde", confidence: 0.98 }] }
  });

  assert.deepEqual(interim, { alternatives: ["bonjour tout le monde"], isFinal: false, text: "bonjour tout le monde" });
  assert.deepEqual(final, { alternatives: ["bonjour tout le monde"], isFinal: true, text: "bonjour tout le monde" });
});

test("parseDeepgramLiveMessage ignores non-result events", () => {
  assert.equal(parseDeepgramLiveMessage({ type: "KeepAlive" }), null);
});
