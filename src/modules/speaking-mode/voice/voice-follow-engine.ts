import { matchTranscriptToItems } from "@/modules/speaking-mode/voice/transcript-matcher";
import type { VoiceFollowMatch, VoiceFollowStatus } from "@/modules/speaking-mode/voice/types";
import type { SpeakingIndexItem } from "./speaking-index";
import type { TalkVocabulary } from "./talk-vocabulary";

export const followConfidenceThreshold = 0.78;
export const lockConfidenceThreshold = 0.58;
export const lostConfidenceThreshold = 0.58;

export function getVoiceFollowMatch(input: {
  alternatives?: string[];
  currentIndex: number;
  indexItems: SpeakingIndexItem[];
  lostForMs: number;
  transcript: string;
  vocabulary?: TalkVocabulary;
}): VoiceFollowMatch {
  return matchTranscriptToItems({
    alternatives: input.alternatives,
    currentIndex: input.currentIndex,
    items: input.indexItems,
    lostForMs: input.lostForMs,
    maxTranscriptWords: 12,
    transcript: input.transcript,
    vocabulary: input.vocabulary
  });
}

export function statusFromConfidence(input: {
  active: boolean;
  confidence: number;
  isSupported: boolean;
  isRequesting: boolean;
  recognitionError: string;
  transcript: string;
}): VoiceFollowStatus {
  if (!input.isSupported) return "unsupported";
  if (!input.active) return "idle";
  if (input.recognitionError) return "error";
  if (input.isRequesting) return "requesting";
  if (!input.transcript.trim()) return "listening";
  if (input.confidence >= followConfidenceThreshold) return "following";
  if (input.confidence >= lostConfidenceThreshold) return "uncertain";
  return "lost";
}
