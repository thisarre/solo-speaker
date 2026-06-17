import type { LockOnState } from "./lock-on-controller";
import type { ProviderHealth } from "./provider-health";
import type { SpeakingIndexItem } from "./speaking-index";
import { evaluateTranscriptQuality, type TranscriptQuality } from "./transcript-quality";
import type { VoiceFollowMatch } from "./types";

export type TranscriptSyncDecision = {
  canApply: boolean;
  needsConfirmation: boolean;
  quality: TranscriptQuality;
  reason: string;
};

export function canApplyTranscriptCorrection(input: {
  currentIndex: number;
  indexItems: SpeakingIndexItem[];
  lockState: LockOnState;
  match: VoiceFollowMatch;
  providerHealth: ProviderHealth;
  transcript: string;
}) {
  const quality = evaluateTranscriptQuality({ indexItems: input.indexItems, transcript: input.transcript });
  if (input.providerHealth === "unusable") return { canApply: false, needsConfirmation: false, quality, reason: "provider-unusable" };
  if (input.providerHealth === "degraded") return { canApply: false, needsConfirmation: false, quality, reason: "provider-degraded" };
  if (!quality.isUsable) return { canApply: false, needsConfirmation: false, quality, reason: quality.reason };
  if (input.match.confidence < 0.75) return { canApply: false, needsConfirmation: false, quality, reason: "low-confidence" };

  const matchedIndex = input.match.matchedIndex;
  if (matchedIndex === null) return { canApply: false, needsConfirmation: false, quality, reason: "no-index" };

  const distance = Math.abs(matchedIndex - input.currentIndex);
  const lockedDistance = input.lockState.lockedIndex === null ? distance : Math.abs(matchedIndex - input.lockState.lockedIndex);
  if (distance <= 4 || lockedDistance <= 4 || input.lockState.globalFallbackEnabled) {
    return { canApply: true, needsConfirmation: false, quality, reason: "recalibrate" };
  }

  return { canApply: false, needsConfirmation: true, quality, reason: "large-jump-needs-confirmation" };
}
