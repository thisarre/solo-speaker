"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { SpeechRecognitionController } from "@/modules/speaking-mode/voice/types";
import { lastTranscriptWords } from "./transcript-buffer";

type SpeechRecognitionResultLike = {
  length?: number;
  isFinal: boolean;
  [index: number]: {
    transcript: string;
  };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorEventLike = {
  error?: string;
  message?: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives?: number;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function getRecognitionConstructor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

function getSpeechSupportSnapshot() {
  return Boolean(getRecognitionConstructor());
}

function getServerSpeechSupportSnapshot() {
  return false;
}

function subscribeSpeechSupport() {
  return () => undefined;
}

function isFatalSpeechError(error?: string) {
  return error === "network" || error === "not-allowed" || error === "service-not-allowed" || error === "audio-capture";
}

function formatSpeechRecognitionError(event: SpeechRecognitionErrorEventLike) {
  if (event.message) return event.message;

  if (event.error === "network") {
    return "Micro autorisé, mais le service SpeechRecognition du navigateur est indisponible. Essayez Chrome ou relancez l'onglet.";
  }

  if (event.error === "not-allowed" || event.error === "service-not-allowed") {
    return "Micro refusé ou bloqué par le navigateur.";
  }

  if (event.error === "audio-capture") {
    return "Aucun micro disponible pour la reconnaissance vocale.";
  }

  if (event.error === "no-speech") {
    return "Aucune voix détectée.";
  }

  return event.error || "Erreur de reconnaissance vocale.";
}

export function useSpeechRecognition(language: import("@/types/talk").TalkLanguage = "FR"): SpeechRecognitionController {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const manuallyStoppedRef = useRef(false);
  const isSupported = useSyncExternalStore(subscribeSpeechSupport, getSpeechSupportSnapshot, getServerSpeechSupportSnapshot);
  const [isRequesting, setIsRequesting] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [lastDeltaAt, setLastDeltaAt] = useState<number | null>(null);
  const [error, setError] = useState("");

  const stop = useCallback(() => {
    manuallyStoppedRef.current = true;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsRequesting(false);
    setInterimTranscript("");
    setAlternatives([]);
  }, []);

  const start = useCallback(() => {
    const Recognition = getRecognitionConstructor();
    if (!Recognition) {
      setError("SpeechRecognition n'est pas supporté par ce navigateur.");
      return;
    }

    stop();
    manuallyStoppedRef.current = false;
    setError("");
    setIsRequesting(true);
    setFinalTranscript("");
    setInterimTranscript("");
    setAlternatives([]);
    setLastDeltaAt(null);

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    const bcp47: Record<import("@/types/talk").TalkLanguage, string> = { FR: "fr-FR", EN: "en-US", ES: "es-ES", DE: "de-DE", IT: "it-IT", PT: "pt-PT" };
    recognition.lang = bcp47[language] ?? "en-US";
    recognition.maxAlternatives = 3;

    recognition.onresult = (event) => {
      setIsRequesting(false);
      let finalText = "";
      let interimText = "";
      const nextAlternatives: string[] = [];

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";
        const alternativeCount = Math.min(result.length ?? 1, 3);
        for (let alternativeIndex = 0; alternativeIndex < alternativeCount; alternativeIndex += 1) {
          const alternative = result[alternativeIndex]?.transcript?.trim();
          if (alternative) nextAlternatives.push(alternative);
        }
        if (result.isFinal) {
          finalText += ` ${transcript}`;
        } else {
          interimText += ` ${transcript}`;
        }
      }

      if (finalText.trim()) {
        setFinalTranscript((current) => lastTranscriptWords(`${current} ${finalText}`, 48));
      }
      setInterimTranscript(lastTranscriptWords(interimText, 14));
      setAlternatives(Array.from(new Set(nextAlternatives)).slice(0, 6));
      setLastDeltaAt(Date.now());
    };

    recognition.onerror = (event) => {
      setIsRequesting(false);
      setError(formatSpeechRecognitionError(event));

      if (isFatalSpeechError(event.error)) {
        manuallyStoppedRef.current = true;
        recognitionRef.current = null;
      }
    };

    recognition.onend = () => {
      setIsRequesting(false);
      if (!manuallyStoppedRef.current) {
        try {
          recognition.start();
        } catch {
          // Some browsers need a new user gesture after an unexpected stop.
        }
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setIsRequesting(false);
      setError("Impossible de démarrer la reconnaissance vocale.");
    }
  }, [language, stop]);

  useEffect(() => stop, [stop]);

  return { alternatives, error, finalTranscript, interimTranscript, isRequesting, isSupported, lastDeltaAt, provider: "browser", start, stop };
}
