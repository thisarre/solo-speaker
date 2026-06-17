import type { SpeakingItem } from "@/modules/speaking-mode/types";
import type { ProviderHealth } from "./provider-health";
import type { TranscriptQuality } from "./transcript-quality";
import type { VoiceActivityStatus } from "./voice-pace-engine";

export type VoiceFollowProvider = "browser" | "realtime" | "unsupported";
export type VoiceFollowProviderMode = "auto" | "browser" | "realtime";

export type VoiceFollowStatus = "idle" | "unsupported" | "requesting" | "listening" | "following" | "uncertain" | "lost" | "paused" | "error";

export type VoiceFollowMatch = {
  matchedItemId: string | null;
  matchedIndex: number | null;
  sectionId: string | null;
  confidence: number;
  matchedText: string;
  matchedWords?: string[];
  reason?: string;
  searchScope?: "local" | "global";
};

export type VoiceFollowState = {
  confidence: number;
  currentIndex: number;
  enabled: boolean;
  error: string;
  followedItemId: string | null;
  followedText: string;
  interimTranscript: string;
  lastDeltaAt: number | null;
  latencyMs: number | null;
  matchedItemId: string | null;
  matchedIndex: number | null;
  matchedSectionId: string | null;
  matchedText: string;
  matchedWords: string[];
  provider: VoiceFollowProvider;
  providerHealth: ProviderHealth;
  providerMode: VoiceFollowProviderMode;
  providerTranscriptAlternatives: string[];
  reason: string;
  searchScope: "local" | "global";
  scrollSource: "auto-scroll" | "manual" | "transcript-sync" | "voice-paced";
  status: VoiceFollowStatus;
  transcript: string;
  transcriptQuality: TranscriptQuality;
  userStatusLabel: string;
  voiceStatus: VoiceActivityStatus;
};

export type SpeechRecognitionController = {
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

export type TranscriptMatchItem = Pick<SpeakingItem, "id" | "sectionId" | "text"> & {
  kind?: SpeakingItem["kind"];
  index?: number;
  keywords?: string[];
  normalizedText?: string;
  phraseNgrams?: string[];
  startWordApprox?: number;
  endWordApprox?: number;
  tokens?: string[];
};
