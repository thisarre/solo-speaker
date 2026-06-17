export type VoiceActivityStatus = "silent" | "speaking" | "uncertain";

export type VoiceActivitySnapshot = {
  noiseFloor: number;
  rms: number;
  speechThreshold: number;
  status: VoiceActivityStatus;
};

export const idleVoiceActivity: VoiceActivitySnapshot = {
  noiseFloor: 0,
  rms: 0,
  speechThreshold: 0.02,
  status: "silent"
};

export function classifyVoiceActivity(input: { noiseFloor: number; rms: number; speechThreshold: number }): VoiceActivityStatus {
  if (input.rms >= input.speechThreshold) return "speaking";
  if (input.rms >= Math.max(input.noiseFloor * 1.45, input.speechThreshold * 0.55)) return "uncertain";
  return "silent";
}

export function createVoiceThreshold(noiseSamples: number[]) {
  const averageNoise = noiseSamples.length ? noiseSamples.reduce((sum, value) => sum + value, 0) / noiseSamples.length : 0.01;
  return {
    noiseFloor: averageNoise,
    speechThreshold: Math.max(0.018, averageNoise * 2.8)
  };
}
