import type { VoiceActivityStatus } from "./voice-pace-engine";

export function getVoicePacedScrollSpeed(input: {
  basePxPerSecond: number;
  isAtEnd: boolean;
  isPaused: boolean;
  userSpeedMultiplier: number;
  voiceStatus: VoiceActivityStatus;
}) {
  if (input.isPaused || input.isAtEnd) return 0;
  if (input.voiceStatus === "speaking") return input.basePxPerSecond * input.userSpeedMultiplier;
  if (input.voiceStatus === "uncertain") return input.basePxPerSecond * 0.35;
  return input.basePxPerSecond * 0.05;
}
