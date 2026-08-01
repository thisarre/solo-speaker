/**
 * Telemetry for the paid services PostHog cannot price on its own.
 *
 * LLM calls already land as `$ai_generation` (see posthog-ai.ts) and PostHog
 * derives their cost from model + tokens. Text-to-speech, speech-to-text and
 * transcription have no such support: without this module their spend is
 * invisible, which is how audio generation ended up completely unmetered.
 *
 * Every payload carries BOTH the raw billable unit (characters, seconds) and a
 * derived `estimated_cost_usd`. The units are exact; the cost is only as good as
 * the rates below. If a rate turns out wrong, recompute from the units in
 * PostHog — never treat `estimated_cost_usd` as authoritative for invoicing.
 */

/**
 * Unit rates in USD. These are ESTIMATES: set them from the actual provider
 * invoices via env vars once the paid tiers are subscribed. The ElevenLabs
 * account is on the free tier (10k characters/month) as of 2026-08-01, so its
 * per-character price depends on the tier that gets chosen.
 */
const RATES = {
  /**
   * Per 1000 characters of speech. Default = OpenAI tts-1 at $15 per 1M characters
   * (developers.openai.com/api/docs/pricing, read 2026-08-02). Raise it to 0.030
   * for tts-1-hd. The previous ElevenLabs setup was $0.182 — twelve times this.
   */
  ttsPerThousandChars: Number(process.env.RATE_TTS_USD_PER_1K_CHARS ?? "0.015"),
  /** Per minute of streamed Deepgram audio. */
  sttPerMinute: Number(process.env.RATE_STT_USD_PER_MINUTE ?? "0.0059"),
  /** Per minute of audio sent to OpenAI transcription. */
  transcriptionPerMinute: Number(process.env.RATE_TRANSCRIPTION_USD_PER_MINUTE ?? "0.003")
};

type Common = {
  distinctId: string;
  /** Billing plan at the time of the call — the axis that matters for margin. */
  plan?: string;
};

function round(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : 0;
}

export function estimateTtsCostUsd(characters: number): number {
  return round(Math.max(0, characters) / 1000 * RATES.ttsPerThousandChars);
}

export function estimateSttCostUsd(seconds: number): number {
  return round(Math.max(0, seconds) / 60 * RATES.sttPerMinute);
}

export function estimateTranscriptionCostUsd(seconds: number): number {
  return round(Math.max(0, seconds) / 60 * RATES.transcriptionPerMinute);
}

export function buildTtsUsageCapture(input: Common & {
  characters: number;
  toneId: string;
  status: number;
  /** True when served from cache — a billable call that did NOT happen. */
  cached?: boolean;
}) {
  const billed = input.cached ? 0 : input.characters;

  return {
    distinctId: input.distinctId,
    event: "tts_generated",
    properties: {
      billing_plan: input.plan,
      cached: Boolean(input.cached),
      characters: input.characters,
      characters_billed: billed,
      estimated_cost_usd: estimateTtsCostUsd(billed),
      is_error: input.status >= 400,
      provider: "openai",
      status: input.status,
      tone_id: input.toneId
    }
  };
}

export function buildSttUsageCapture(input: Common & { seconds: number }) {
  return {
    distinctId: input.distinctId,
    event: "stt_confirmed",
    properties: {
      billing_plan: input.plan,
      estimated_cost_usd: estimateSttCostUsd(input.seconds),
      provider: "deepgram",
      seconds: input.seconds
    }
  };
}

export function buildTranscriptionUsageCapture(input: Common & {
  seconds: number;
  model: string;
  status: number;
}) {
  return {
    distinctId: input.distinctId,
    event: "transcription_generated",
    properties: {
      billing_plan: input.plan,
      estimated_cost_usd: input.status >= 400 ? 0 : estimateTranscriptionCostUsd(input.seconds),
      is_error: input.status >= 400,
      model: input.model,
      provider: "openai",
      seconds: input.seconds,
      status: input.status
    }
  };
}
