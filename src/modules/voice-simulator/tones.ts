export type ToneId = "confiant" | "chaleureux" | "dynamique" | "serein";

export type Tone = {
  id: ToneId;
  voiceId: string;
  stability: number;
  similarityBoost: number;
  style: number;
  speakerBoost: boolean;
};

// ElevenLabs multilingual v2 voices — all support French natively.
// Only `premade` voices are usable here: library (shared) voices return 402
// `paid_plan_required` on the free tier. Check with GET /v1/voices before
// swapping an id — a voice absent from that list will fail at playback.
// Labels and descriptions live in i18n (voiceSimulator.tones).
export const tones: Tone[] = [
  {
    id: "confiant",
    voiceId: "onwK4e9ZLuTAKqWW03F9", // Daniel
    stability: 0.78,
    similarityBoost: 0.85,
    style: 0.2,
    speakerBoost: true
  },
  {
    id: "chaleureux",
    voiceId: "hpp4J3VqNfWAUOO0d1Us", // Bella
    stability: 0.65,
    similarityBoost: 0.80,
    style: 0.5,
    speakerBoost: true
  },
  {
    id: "dynamique",
    voiceId: "TX3LPaxmHKxFdv7VOQHJ", // Liam
    stability: 0.48,
    similarityBoost: 0.75,
    style: 0.72,
    speakerBoost: true
  },
  {
    id: "serein",
    voiceId: "pFZP5JQG7iQjIQuC4Bku", // Lily
    stability: 0.88,
    similarityBoost: 0.82,
    style: 0.08,
    speakerBoost: false
  }
];

export function getTone(id: ToneId): Tone {
  return tones.find((t) => t.id === id) ?? tones[0];
}
