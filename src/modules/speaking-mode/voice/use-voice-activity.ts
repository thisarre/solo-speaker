"use client";

import { useEffect, useRef, useState } from "react";
import { idleVoiceActivity, type VoiceActivitySnapshot } from "./voice-pace-engine";

// Derive "is the speaker talking" from transcript freshness instead of opening a second microphone
// stream. A dedicated getUserMedia/AnalyserNode here used to fight the recognition provider for the
// mic — the analyser won, the recogniser was starved and produced an empty transcript. Voice
// activity now rides on the recognition we already have: a transcript delta in the last ~1.2s means
// speech is flowing. One mic consumer (the recogniser), deterministically.
const speakingWindowMs = 1200;

export function useVoiceActivity(enabled: boolean, lastDeltaAt: number | null): VoiceActivitySnapshot {
  const [snapshot, setSnapshot] = useState<VoiceActivitySnapshot>(idleVoiceActivity);
  const lastDeltaRef = useRef<number | null>(lastDeltaAt);

  useEffect(() => {
    lastDeltaRef.current = lastDeltaAt;
  }, [lastDeltaAt]);

  useEffect(() => {
    if (!enabled) return;
    const intervalId = window.setInterval(() => {
      const last = lastDeltaRef.current;
      const speaking = last !== null && Date.now() - last < speakingWindowMs;
      setSnapshot((current) => {
        const status = speaking ? "speaking" : "silent";
        return current.status === status ? current : { ...idleVoiceActivity, status };
      });
    }, 200);
    return () => window.clearInterval(intervalId);
  }, [enabled]);

  return snapshot;
}
