import { followConfidenceThreshold, lockConfidenceThreshold, lostConfidenceThreshold } from "./voice-follow-engine";
import type { VoiceFollowMatch } from "./types";

export type LockOnState = {
  globalFallbackEnabled: boolean;
  lockedIndex: number | null;
  lockedItemId: string | null;
  pendingCount: number;
  pendingItemId: string | null;
};

export type LockOnDecision = LockOnState & {
  accepted: boolean;
  statusHint: "following" | "uncertain" | "lost";
};

export const defaultLockOnState: LockOnState = {
  globalFallbackEnabled: false,
  lockedIndex: null,
  lockedItemId: null,
  pendingCount: 0,
  pendingItemId: null
};

export function resetLockOn(): LockOnState {
  return { ...defaultLockOnState };
}

export function decideLockOn(state: LockOnState, match: VoiceFollowMatch): LockOnDecision {
  if (!match.matchedItemId || match.confidence < lostConfidenceThreshold) {
    return {
      ...state,
      pendingCount: 0,
      pendingItemId: null,
      accepted: false,
      statusHint: "lost"
    };
  }

  if (match.confidence < lockConfidenceThreshold) {
    return {
      ...state,
      accepted: false,
      statusHint: "uncertain"
    };
  }

  const lockedIndex = state.lockedIndex;
  const matchedIndex = match.matchedIndex;
  const forwardDelta = lockedIndex !== null && matchedIndex !== null ? matchedIndex - lockedIndex : 0;
  const smallForwardMove = forwardDelta >= 0 && forwardDelta <= 3;
  const backwardJump = forwardDelta < -2;
  const bigJump = Math.abs(forwardDelta) > 4;
  const samePending = state.pendingItemId === match.matchedItemId;
  const pendingCount = samePending ? state.pendingCount + 1 : 1;
  const strongLocalMatch = match.confidence >= followConfidenceThreshold && !backwardJump && (!bigJump || smallForwardMove);
  const confirmedJump = pendingCount >= 2 && !backwardJump;
  const accepted = strongLocalMatch || confirmedJump || lockedIndex === null;

  if (!accepted) {
    return {
      ...state,
      pendingCount,
      pendingItemId: match.matchedItemId,
      accepted: false,
      statusHint: "uncertain"
    };
  }

  return {
    globalFallbackEnabled: false,
    lockedIndex: matchedIndex,
    lockedItemId: match.matchedItemId,
    pendingCount: 0,
    pendingItemId: null,
    accepted: true,
    statusHint: "following"
  };
}
