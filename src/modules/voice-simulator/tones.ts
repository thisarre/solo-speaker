export type ToneId = "confiant" | "chaleureux" | "dynamique" | "serein";

export type Tone = {
  id: ToneId;
  /** OpenAI `tts-1` voice name. */
  voiceId: string;
  /** Playback speed accepted by tts-1, between 0.25 and 4.0. */
  speed: number;
};

/**
 * OpenAI tts-1 voices.
 *
 * Migrated off ElevenLabs on 2026-08-02: at $0.182 per 1000 characters, a single
 * subscriber replaying a 10-minute talk six times a month already cost more than
 * a Studio plan brings in. tts-1 is $0.015 per 1000 characters — twelve times
 * cheaper — and reuses the OpenAI key the assistant already needs.
 *
 * Voices chosen for maximum contrast between tones (two male, two female).
 * Swapping one is a single line; the full set is alloy, echo, fable, onyx, nova
 * and shimmer. Labels and descriptions live in i18n (voiceSimulator.tones).
 */
export const tones: Tone[] = [
  {
    id: "confiant",
    voiceId: "onyx",
    speed: 0.95
  },
  {
    id: "chaleureux",
    voiceId: "shimmer",
    speed: 1
  },
  {
    id: "dynamique",
    voiceId: "nova",
    speed: 1.1
  },
  {
    id: "serein",
    voiceId: "alloy",
    speed: 0.9
  }
];

export function getTone(id: ToneId): Tone {
  return tones.find((t) => t.id === id) ?? tones[0];
}
