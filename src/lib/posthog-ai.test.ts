import assert from "node:assert/strict";
import test from "node:test";
import { buildAiGenerationCapture } from "./posthog-ai";

test("buildAiGenerationCapture uses the PostHog AI Observability event name", () => {
  const capture = buildAiGenerationCapture({
    action: "outline",
    distinctId: "user_123",
    input: [{ role: "user", content: "Create a talk outline" }],
    latencySeconds: 1.23,
    model: "gpt-5-mini",
    outputText: "{\"sections\":[]}",
    provider: "openai",
    status: 200,
    talkLanguage: "EN",
    talkType: "conference",
    tokens: {
      input: 12,
      output: 8
    }
  });

  assert.equal(capture.distinctId, "user_123");
  assert.equal(capture.event, "$ai_generation");
  assert.equal(capture.properties.$ai_model, "gpt-5-mini");
  assert.equal(capture.properties.$ai_provider, "openai");
  assert.equal(capture.properties.$ai_latency, 1.23);
  assert.equal(capture.properties.$ai_http_status, 200);
  assert.equal(capture.properties.$ai_input_tokens, 12);
  assert.equal(capture.properties.$ai_output_tokens, 8);
  assert.equal(capture.properties.action, "outline");
  assert.equal(capture.properties.talk_type, "conference");
});
