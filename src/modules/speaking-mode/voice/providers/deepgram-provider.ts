"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { TranscriptionProviderController } from "./transcription-provider";
import { lastTranscriptWords } from "../transcript-buffer";

type DeepgramTokenResponse = {
  access_token?: string;
  expires_in?: number;
  engine?: "cloud" | "browser";
  reason?: string;
  error?: string;
};

// Marker the auto-fallback effect in use-voice-follow watches for ("aucun delta").
// When the STT cap is reached the mint endpoint returns { engine: "browser" } with no
// access_token; we surface the same fallback signal so speaking mode switches to the
// in-browser provider for the rest of the session.
const CAP_REACHED_ERROR = "Quota Deepgram atteint — aucun delta cloud, bascule sur navigateur.";

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

export function buildDeepgramListenUrl(language: "FR" | "EN", model = defaultDeepgramModel) {
  const params = new URLSearchParams({
    model,
    language: language === "EN" ? "en" : "fr",
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

export function useDeepgramProvider(language: "FR" | "EN"): TranscriptionProviderController {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const noDeltaTimeoutRef = useRef(0);
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [error, setError] = useState("");
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

  const stop = useCallback(() => {
    window.clearTimeout(noDeltaTimeoutRef.current);
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    socketRef.current?.close();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaRecorderRef.current = null;
    mediaStreamRef.current = null;
    socketRef.current = null;
    sessionIdRef.current = null;
    setIsRequesting(false);
    setInterimTranscript("");
  }, []);

  const start = useCallback(async () => {
    if (!isSupported) {
      setError("Deepgram indisponible dans ce navigateur.");
      return;
    }

    stop();
    setAlternatives([]);
    setError("");
    setFinalTranscript("");
    setInterimTranscript("");
    setIsRequesting(true);
    setLastDeltaAt(null);

    // One stable session UUID per speaking session; re-used on every ~60s re-mint so the
    // server can keep this session's reserved_seconds in sync with the usage counter.
    const sessionId = sessionIdRef.current ?? crypto.randomUUID();
    sessionIdRef.current = sessionId;

    try {
      const tokenResponse = await fetch("/api/deepgram/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });
      const tokenPayload = (await tokenResponse.json().catch(() => ({}))) as DeepgramTokenResponse;

      // Cap reached: server tells us to use the in-browser engine. Surface the fallback
      // signal so use-voice-follow switches providers for the rest of the session.
      if (tokenResponse.ok && tokenPayload.engine === "browser" && !tokenPayload.access_token) {
        stop();
        setError(CAP_REACHED_ERROR);
        return;
      }

      if (!tokenResponse.ok || !tokenPayload.access_token) {
        throw new Error(tokenPayload.error ?? "Token Deepgram indisponible.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const socket = new WebSocket(buildDeepgramListenUrl(language), ["token", tokenPayload.access_token]);

      socket.addEventListener("open", () => {
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
  }, [isSupported, language, stop]);

  return {
    alternatives,
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
