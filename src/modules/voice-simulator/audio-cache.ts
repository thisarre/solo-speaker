import type { ToneId } from "@/modules/voice-simulator/tones";

/**
 * Session-scoped cache of synthesized sections, keyed by (tone, text).
 *
 * Two jobs:
 *  - dedupe: a section already fetched (or in flight) is never synthesized twice,
 *    which matters because ElevenLabs bills per generated character;
 *  - prefetch: the panel warms the next section while the current one plays, so
 *    the gap between blocks is playback-to-playback instead of a full round trip.
 */

const MAX_ENTRIES = 12;

/** Module-level so the cache survives closing and reopening the panel. */
const cache = new Map<string, Promise<Blob>>();

export class SpeakError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = "SpeakError";
    this.code = code;
  }
}

/** djb2 — enough to key cache entries, not a security primitive. */
function hash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i += 1) {
    h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

function keyFor(text: string, toneId: ToneId): string {
  return `${toneId}:${text.length}:${hash(text)}`;
}

async function synthesize(text: string, toneId: ToneId): Promise<Blob> {
  const response = await fetch("/api/ai/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, toneId })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { code?: string };
    throw new SpeakError(err.code ?? "provider_error");
  }

  return response.blob();
}

/**
 * Resolves to the audio for this (text, tone), synthesizing only on a miss.
 * Requests are never aborted: a generation the user cancelled mid-flight is
 * already billed, so it is worth keeping for the replay.
 */
export function getAudio(text: string, toneId: ToneId): Promise<Blob> {
  const key = keyFor(text, toneId);
  const hit = cache.get(key);
  if (hit) return hit;

  const pending = synthesize(text, toneId);
  // A failed generation must not be cached, or the tone stays broken until reload.
  pending.catch(() => { cache.delete(key); });

  cache.set(key, pending);

  // Oldest-first eviction; insertion order is Map's iteration order.
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next();
    if (oldest.done) break;
    cache.delete(oldest.value);
  }

  return pending;
}

/** Fire-and-forget warm-up. Errors surface later, on the real playback attempt. */
export function prefetchAudio(text: string, toneId: ToneId): void {
  if (!text) return;
  getAudio(text, toneId).catch(() => {});
}
