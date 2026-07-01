import type { VoiceFollowProvider } from "../types";

export type TranscriptionProviderController = {
  alternatives: string[];
  // True once the STT mint endpoint reports the plan's cloud cap is reached for this session.
  // Drives a mode-independent switch to the in-browser provider in use-voice-follow.
  capReached?: boolean;
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

import type { TalkLanguage } from "@/types/talk";

export function languageToRealtimeCode(language: TalkLanguage) {
  const map: Record<TalkLanguage, string> = { FR: "fr", EN: "en", ES: "es", DE: "de", IT: "it", PT: "pt" };
  return map[language] ?? "en";
}
