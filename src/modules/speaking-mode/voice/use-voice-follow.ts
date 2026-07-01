"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SpeakingItem } from "@/modules/speaking-mode/types";
import { getVoiceFollowMatch, lockConfidenceThreshold, statusFromConfidence } from "@/modules/speaking-mode/voice/voice-follow-engine";
import { useSpeechRecognition } from "@/modules/speaking-mode/voice/use-speech-recognition";
import type { VoiceFollowProviderMode, VoiceFollowState } from "@/modules/speaking-mode/voice/types";
import { decideLockOn, resetLockOn, type LockOnState } from "./lock-on-controller";
import { getProviderHealth } from "./provider-health";
import { buildSpeakingIndex } from "./speaking-index";
import { buildTalkVocabulary } from "./talk-vocabulary";
import { mergeTranscriptBuffer } from "./transcript-buffer";
import { canApplyTranscriptCorrection } from "./transcript-sync-engine";
import { evaluateTranscriptQuality } from "./transcript-quality";
import { useDeepgramProvider } from "./providers/deepgram-provider";
import { readVoiceProviderPreference } from "@/modules/settings/studio-preferences";

export function useVoiceFollow(items: SpeakingItem[], language: import("@/types/talk").TalkLanguage, currentIndex: number, talkId?: string | null) {
  const browserRecognition = useSpeechRecognition(language);
  const deepgramRecognition = useDeepgramProvider(language, talkId);
  const [enabled, setEnabled] = useState(false);
  const [providerMode, setProviderMode] = useState<VoiceFollowProviderMode>(() => readVoiceProviderPreference());
  const [autoDeepgramDisabled, setAutoDeepgramDisabled] = useState(false);
  const [capReachedDisabled, setCapReachedDisabled] = useState(false);
  const [lockState, setLockState] = useState<LockOnState>(() => resetLockOn());
  const globalFallbackTimerRef = useRef(0);
  // Cap-reached forces the browser provider in ALL modes (forced-deepgram included).
  const shouldUseDeepgram =
    !capReachedDisabled &&
    (providerMode === "deepgram" ||
      (providerMode === "auto" && !browserRecognition.isSupported && deepgramRecognition.isSupported && !autoDeepgramDisabled));
  const activeRecognition = shouldUseDeepgram ? deepgramRecognition : browserRecognition;
  const vocabulary = useMemo(() => buildTalkVocabulary({ items }), [items]);
  const speakingIndex = useMemo(() => buildSpeakingIndex(items, vocabulary), [items, vocabulary]);
  const transcriptBuffer = useMemo(
    () => mergeTranscriptBuffer({ finalTranscript: activeRecognition.finalTranscript, interimTranscript: activeRecognition.interimTranscript }),
    [activeRecognition.finalTranscript, activeRecognition.interimTranscript]
  );
  const transcript = transcriptBuffer.recentText;
  // No acoustic VAD any more, so we can't tell a silent pause from a stalled provider — never
  // degrade on staleness here (that path wrongly disabled transcript-sync during normal pauses).
  // A genuinely stuck Deepgram session is still caught by the provider's explicit "aucun delta"
  // timeout, which trips the browser fallback below.
  const providerHealth = getProviderHealth({ latencyMs: null, provider: activeRecognition.provider });
  const stableCurrentIndex = lockState.lockedIndex ?? currentIndex;
  const match = useMemo(
    () =>
      getVoiceFollowMatch({
        alternatives: activeRecognition.alternatives,
        currentIndex: stableCurrentIndex,
        indexItems: speakingIndex,
        lostForMs: lockState.globalFallbackEnabled ? 3001 : 0,
        transcript,
        vocabulary
      }),
    [activeRecognition.alternatives, lockState.globalFallbackEnabled, speakingIndex, stableCurrentIndex, transcript, vocabulary]
  );
  const status = statusFromConfidence({
    active: enabled,
    confidence: match.confidence,
    isRequesting: activeRecognition.isRequesting,
    isSupported: activeRecognition.isSupported,
    recognitionError: activeRecognition.error,
    transcript
  });
  const transcriptQuality = evaluateTranscriptQuality({ indexItems: speakingIndex, transcript });
  const transcriptSync = canApplyTranscriptCorrection({
    currentIndex,
    indexItems: speakingIndex,
    lockState,
    match,
    providerHealth,
    transcript
  });

  useEffect(() => {
    if (!enabled) return;
    if (!transcriptSync.canApply) return;
    const timeoutId = window.setTimeout(() => {
      setLockState((current) => decideLockOn(current, match));
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [enabled, match, transcriptSync.canApply]);

  useEffect(() => {
    if (!enabled || match.confidence >= lockConfidenceThreshold) return;

    const timeoutId = window.setTimeout(() => {
      setLockState((current) => ({ ...current, globalFallbackEnabled: true }));
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [enabled, match.confidence, transcript]);

  const hasFollowMatch = enabled && Boolean(lockState.lockedItemId) && status === "following" && transcriptSync.canApply;

  const resetRuntime = useCallback(() => {
    window.clearTimeout(globalFallbackTimerRef.current);
    setLockState(resetLockOn());
  }, []);

  const start = useCallback(() => {
    resetRuntime();

    if (!activeRecognition.isSupported) {
      setEnabled(true);
      return;
    }

    setEnabled(true);
    activeRecognition.start();
  }, [activeRecognition, resetRuntime]);

  const stop = useCallback(() => {
    setEnabled(false);
    resetRuntime();
    activeRecognition.stop();
    browserRecognition.stop();
    deepgramRecognition.stop();
  }, [activeRecognition, browserRecognition, deepgramRecognition, resetRuntime]);

  const toggle = useCallback(() => {
    if (enabled) {
      stop();
    } else {
      start();
    }
  }, [enabled, start, stop]);

  useEffect(() => {
    if (!activeRecognition.isSupported && enabled) {
      activeRecognition.stop();
    }
  }, [activeRecognition, enabled]);

  useEffect(() => {
    if (!enabled || providerMode !== "auto" || activeRecognition.provider !== "deepgram") return;
    if (!activeRecognition.error.includes("aucun delta")) return;

    const timeoutId = window.setTimeout(() => {
      deepgramRecognition.stop();
      setAutoDeepgramDisabled(true);
      browserRecognition.start();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [activeRecognition.error, activeRecognition.provider, browserRecognition, deepgramRecognition, enabled, providerMode]);

  // Cap reached: switch to the browser provider for the rest of the session, regardless of
  // provider mode (including forced "deepgram"). Distinct from the no-delta path above.
  useEffect(() => {
    if (!enabled || !deepgramRecognition.capReached || capReachedDisabled) return;

    const timeoutId = window.setTimeout(() => {
      deepgramRecognition.stop();
      setCapReachedDisabled(true);
      browserRecognition.start();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [enabled, deepgramRecognition.capReached, capReachedDisabled, browserRecognition, deepgramRecognition]);

  const recalibrate = useCallback(() => {
    setLockState((current) => ({ ...current, globalFallbackEnabled: true, lockedIndex: null, lockedItemId: null, pendingCount: 0, pendingItemId: null }));
  }, []);

  const state: VoiceFollowState = {
    confidence: match.confidence,
    currentIndex,
    enabled,
    error: activeRecognition.error,
    followedItemId: hasFollowMatch ? lockState.lockedItemId : null,
    followedText: hasFollowMatch ? match.matchedText : "",
    interimTranscript: transcriptBuffer.interimText,
    lastDeltaAt: activeRecognition.lastDeltaAt,
    latencyMs: null,
    matchedItemId: match.matchedItemId,
    matchedIndex: match.matchedIndex,
    matchedSectionId: match.sectionId,
    matchedText: match.matchedText,
    matchedWords: match.matchedWords ?? [],
    provider: activeRecognition.isSupported ? activeRecognition.provider : "unsupported",
    providerHealth,
    providerMode,
    providerTranscriptAlternatives: activeRecognition.alternatives,
    reason: transcriptSync.canApply ? match.reason ?? "" : transcriptSync.reason,
    searchScope: match.searchScope ?? "local",
    scrollSource: transcriptSync.canApply ? "transcript-sync" : "voice-paced",
    status,
    transcript
    ,
    transcriptQuality,
    userStatusLabel: formatUserStatus({ enabled, providerHealth, status, transcriptSyncCanApply: transcriptSync.canApply }),
    voiceStatus: "silent"
  };

  return { recalibrate, setProviderMode, start, state, stop, toggle };
}

function formatUserStatus(input: { enabled: boolean; providerHealth: string; status: string; transcriptSyncCanApply: boolean }) {
  if (!input.enabled) return "Écoute";
  if (input.providerHealth === "unusable") return "Transcription lente";
  if (input.transcriptSyncCanApply) return "Recalage";
  if (input.status === "lost" || input.status === "uncertain") return "Suit le rythme";
  return "Écoute";
}
