import assert from "node:assert/strict";
import test from "node:test";
import { parseRealtimeTranscriptionEvent } from "./providers/openai-realtime-provider";

test("parseRealtimeTranscriptionEvent reads realtime transcription deltas", () => {
  assert.deepEqual(
    parseRealtimeTranscriptionEvent({
      delta: "Bonjour",
      type: "conversation.item.input_audio_transcription.delta"
    }),
    { isFinal: false, text: "Bonjour" }
  );
});

test("parseRealtimeTranscriptionEvent reads completed realtime transcripts", () => {
  assert.deepEqual(
    parseRealtimeTranscriptionEvent({
      transcript: "Bonjour à tous",
      type: "conversation.item.input_audio_transcription.completed"
    }),
    { isFinal: true, text: "Bonjour à tous" }
  );
});

test("parseRealtimeTranscriptionEvent preserves legacy fallback events", () => {
  assert.deepEqual(parseRealtimeTranscriptionEvent({ delta: "hello", type: "transcript.final" }), { isFinal: true, text: "hello" });
});
