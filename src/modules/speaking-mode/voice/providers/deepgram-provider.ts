"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TranscriptionProviderController } from "./transcription-provider";
import { languageToRealtimeCode } from "./transcription-provider";
import { lastTranscriptWords } from "../transcript-buffer";
import type { TalkLanguage } from "@/types/talk";

type DeepgramTokenResponse = {
  access_token?: string;
  expires_in?: number;
  engine?: "cloud" | "browser";
  reason?: string;
  error?: string;
};

// When the STT cap is reached the mint endpoint returns { engine: "browser" } with no
// access_token. We surface an explicit `capReached` flag (see the controller type) so
// use-voice-follow can switch to the in-browser provider regardless of provider mode.
const CAP_REACHED_ERROR = "Quota Deepgram atteint — bascule sur la transcription navigateur.";

type DeepgramAlternative = {
  confidence?: number;
  transcript?: string;
};

type DeepgramLiveMessage = {
  channel?: {
    alternatives?: DeepgramAlternative[];
  };
  is_final?: boolean;
  speech_final?: boolean;
  type?: string;
};

const defaultDeepgramModel = process.env.NEXT_PUBLIC_DEEPGRAM_MODEL ?? "nova-3";
const mediaRecorderMimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

export function buildDeepgramListenUrl(language: TalkLanguage, model = defaultDeepgramModel) {
  const params = new URLSearchParams({
    model,
    language: languageToRealtimeCode(language),
    interim_results: "true",
    endpointing: "350",
    punctuate: "true",
    smart_format: "true"
  });

  return `wss://api.deepgram.com/v1/listen?${params.toString()}`;
}

export function parseDeepgramLiveMessage(message: DeepgramLiveMessage) {
  if (message.type !== "Results") return null;

  const alternatives = (message.channel?.alternatives ?? [])
    .map((alternative) => alternative.transcript?.trim() ?? "")
    .filter(Boolean);
  const text = alternatives[0] ?? "";
  if (!text) return null;

  return {
    alternatives,
    isFinal: Boolean(message.is_final || message.speech_final),
    text
  };
}

export function useDeepgramProvider(language: TalkLanguage, talkId?: string | null): TranscriptionProviderController {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  // Set only once a CLOUD session actually mints a token; null for the browser-fallback path.
  // Used at stop() to confirm the real used seconds so the server releases the reservation.
  const cloudStartedAtRef = useRef<number | null>(null);
  const noDeltaTimeoutRef = useRef(0);
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [capReached, setCapReached] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [lastDeltaAt, setLastDeltaAt] = useState<number | null>(null);

  const isSupported = useMemo(() => {
    if (typeof window === "undefined") return false;
    return Boolean(
      typeof navigator.mediaDevices?.getUserMedia === "function" &&
        typeof window.MediaRecorder === "function" &&
        typeof window.WebSocket === "function"
    );
  }, []);

  // Fire-and-forget: report the real used seconds so the server releases this session's
  // reservation. Only runs for a CLOUD session (both sessionId and a cloud start time set);
  // browser-fallback sessions never reserved, so they must NOT confirm. Idempotent server-side.
  const confirmCloudSession = useCallback(() => {
    const sessionId = sessionIdRef.current;
    const startedAt = cloudStartedAtRef.current;
    // Clear immediately so a re-start() is a fresh session and we never double-confirm.
    sessionIdRef.current = null;
    cloudStartedAtRef.current = null;
    if (!sessionId || startedAt === null) return;

    const confirmedSeconds = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
    const payload = JSON.stringify({ sessionId, confirmedSeconds });

    try {
      // Prefer sendBeacon: survives page teardown without keeping a listener around.
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon("/api/stt/session", new Blob([payload], { type: "application/json" }));
        return;
      }
    } catch {
      // Fall through to fetch below.
    }

    void fetch("/api/stt/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true
    }).catch(() => {
      // Best-effort; the sweep cron is the backstop for a dropped confirm.
    });
  }, []);

  const stop = useCallback(() => {
    window.clearTimeout(noDeltaTimeoutRef.current);
    confirmCloudSession();
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    socketRef.current?.close();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaRecorderRef.current = null;
    mediaStreamRef.current = null;
    socketRef.current = null;
    setIsRequesting(false);
    setInterimTranscript("");
  }, [confirmCloudSession]);

  const start = useCallback(async () => {
    if (!isSupported) {
      setError("Deepgram indisponible dans ce navigateur.");
      return;
    }

    stop();
    setAlternatives([]);
    setError("");
    setCapReached(false);
    setFinalTranscript("");
    setInterimTranscript("");
    setIsRequesting(true);
    setLastDeltaAt(null);

    // One stable session UUID per speaking session; re-used on every ~60s re-mint so the
    // server keeps this session's single reservation in sync with the usage counter.
    const sessionId = sessionIdRef.current ?? crypto.randomUUID();
    sessionIdRef.current = sessionId;

    try {
      const tokenResponse = await fetch("/api/deepgram/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, talkId: talkId ?? undefined })
      });
      const tokenPayload = (await tokenResponse.json().catch(() => ({}))) as DeepgramTokenResponse;

      // Cap reached: server tells us to use the in-browser engine. Raise an explicit
      // capReached flag so use-voice-follow switches providers (any provider mode).
      if (tokenResponse.ok && tokenPayload.engine === "browser" && !tokenPayload.access_token) {
        stop();
        setCapReached(true);
        setError(CAP_REACHED_ERROR);
        return;
      }

      if (!tokenResponse.ok || !tokenPayload.access_token) {
        throw new Error(tokenPayload.error ?? "Token Deepgram indisponible.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const socket = new WebSocket(buildDeepgramListenUrl(language), ["token", tokenPayload.access_token]);

      socket.addEventListener("open", () => {
        // Cloud session is live: mark the start so stop() can confirm the real used seconds.
        cloudStartedAtRef.current = Date.now();
        const mimeType = mediaRecorderMimeTypes.find((candidate) => MediaRecorder.isTypeSupported(candidate));
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        recorder.addEventListener("dataavailable", (event) => {
          if (!event.data.size || socket.readyState !== WebSocket.OPEN) return;
          socket.send(event.data);
        });
        recorder.start(250);
        mediaRecorderRef.current = recorder;
        setIsRequesting(false);

        noDeltaTimeoutRef.current = window.setTimeout(() => {
          setError("Deepgram connecté, mais aucun delta reçu. Bascule sur navigateur si besoin.");
        }, 6500);
      });

      socket.addEventListener("message", (event) => {
        try {
          const parsed = parseDeepgramLiveMessage(JSON.parse(String(event.data)) as DeepgramLiveMessage);
          if (!parsed) return;

          window.clearTimeout(noDeltaTimeoutRef.current);
          setLastDeltaAt(Date.now());
          setAlternatives(parsed.alternatives);

          if (parsed.isFinal) {
            setFinalTranscript((current) => lastTranscriptWords(`${current} ${parsed.text}`, 48));
            setInterimTranscript("");
            return;
          }

          setInterimTranscript(lastTranscriptWords(parsed.text, 18));
        } catch {
          // Ignore keep-alives and non-transcription control messages.
        }
      });

      socket.addEventListener("error", () => {
        setError("Connexion Deepgram impossible.");
      });

      socket.addEventListener("close", () => {
        setIsRequesting(false);
      });

      mediaStreamRef.current = stream;
      socketRef.current = socket;
    } catch (deepgramError) {
      stop();
      setError(deepgramError instanceof Error ? deepgramError.message : "Transcription Deepgram impossible.");
    }
  }, [isSupported, language, stop, talkId]);

  // Safety net: if the tab is closed/backgrounded mid-session (stop() never runs), confirm the
  // cloud session via sendBeacon so the reservation still releases. No-op when no cloud session
  // is active (confirmCloudSession early-returns). Listener is removed on unmount.
  useEffect(() => {
    const onPageHide = () => confirmCloudSession();
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [confirmCloudSession]);

  return {
    alternatives,
    capReached,
    error,
    finalTranscript,
    interimTranscript,
    isRequesting,
    isSupported,
    lastDeltaAt,
    provider: "deepgram",
    start,
    stop
  };
}
