import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSttUsageCapture,
  buildTranscriptionUsageCapture,
  buildTtsUsageCapture,
  estimateTtsCostUsd
} from "./usage-telemetry";

test("buildTtsUsageCapture reports characters and derived cost", () => {
  const capture = buildTtsUsageCapture({
    characters: 8000,
    distinctId: "user_123",
    plan: "studio",
    status: 200,
    toneId: "chaleureux"
  });

  assert.equal(capture.event, "tts_generated");
  assert.equal(capture.distinctId, "user_123");
  assert.equal(capture.properties.characters, 8000);
  assert.equal(capture.properties.characters_billed, 8000);
  assert.equal(capture.properties.billing_plan, "studio");
  assert.equal(capture.properties.tone_id, "chaleureux");
  assert.equal(capture.properties.is_error, false);
  assert.equal(capture.properties.estimated_cost_usd, estimateTtsCostUsd(8000));
  assert.ok(capture.properties.estimated_cost_usd > 0);
});

test("a cache hit records the characters but bills nothing", () => {
  const capture = buildTtsUsageCapture({
    cached: true,
    characters: 8000,
    distinctId: "user_123",
    status: 200,
    toneId: "confiant"
  });

  assert.equal(capture.properties.cached, true);
  assert.equal(capture.properties.characters, 8000, "raw volume stays visible");
  assert.equal(capture.properties.characters_billed, 0);
  assert.equal(capture.properties.estimated_cost_usd, 0);
});

test("a failed TTS call is flagged as an error", () => {
  const capture = buildTtsUsageCapture({
    characters: 120,
    distinctId: "user_123",
    status: 402,
    toneId: "chaleureux"
  });

  assert.equal(capture.properties.is_error, true);
  assert.equal(capture.properties.status, 402);
});

test("estimateTtsCostUsd scales linearly and never goes negative", () => {
  assert.equal(estimateTtsCostUsd(2000), Number((estimateTtsCostUsd(1000) * 2).toFixed(6)));
  assert.equal(estimateTtsCostUsd(0), 0);
  assert.equal(estimateTtsCostUsd(-500), 0);
});

test("buildSttUsageCapture reports seconds and cost", () => {
  const capture = buildSttUsageCapture({ distinctId: "user_123", plan: "pro", seconds: 600 });

  assert.equal(capture.event, "stt_confirmed");
  assert.equal(capture.properties.seconds, 600);
  assert.equal(capture.properties.provider, "deepgram");
  assert.ok(capture.properties.estimated_cost_usd > 0);
});

test("a failed transcription costs nothing", () => {
  const ok = buildTranscriptionUsageCapture({
    distinctId: "user_123",
    model: "gpt-4o-mini-transcribe",
    seconds: 60,
    status: 200
  });
  const failed = buildTranscriptionUsageCapture({
    distinctId: "user_123",
    model: "gpt-4o-mini-transcribe",
    seconds: 60,
    status: 429
  });

  assert.ok(ok.properties.estimated_cost_usd > 0);
  assert.equal(failed.properties.estimated_cost_usd, 0);
  assert.equal(failed.properties.is_error, true);
});
