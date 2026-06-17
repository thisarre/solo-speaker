import type { VoiceFollowProvider } from "../types";

export type TranscriptionProviderController = {
  alternatives: string[];
  error: string;
  finalTranscript: string;
  interimTranscript: string;
  isRequesting: boolean;
  isSupported: boolean;
  lastDeltaAt: number | null;
  provider: VoiceFollowProvider;
  start: () => void;
  stop: () => void;
};

export function languageToRealtimeCode(language: "FR" | "EN") {
  return language === "EN" ? "en" : "fr";
}
