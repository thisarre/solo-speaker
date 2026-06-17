"use client";

import { Clipboard, Loader2, Mic, Plus, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { transcribeVoiceMemo } from "@/modules/voice-memo/actions";

type VoiceMemoRecorderProps = {
  language: "FR" | "EN";
  onInsert: (text: string) => void;
};

type RecorderState = "idle" | "recording" | "transcribing";

function getSupportedMimeType() {
  if (typeof MediaRecorder === "undefined") return "";

  const options = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return options.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function VoiceMemoRecorder({ language, onInsert }: VoiceMemoRecorderProps) {
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const isRecording = state === "recording";
  const isTranscribing = state === "transcribing";
  const isUnsupported = typeof window !== "undefined" && (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined");

  useEffect(() => {
    if (!isRecording) return;

    const intervalId = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isRecording]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startRecording() {
    setError("");
    setCopied(false);
    setTranscript("");

    if (isUnsupported) {
      setError("L'enregistrement audio n'est pas disponible dans ce navigateur.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      chunksRef.current = [];
      streamRef.current = stream;
      recorderRef.current = recorder;
      setElapsedSeconds(0);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const audio = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        void transcribe(audio);
      };

      recorder.start();
      setState("recording");
    } catch (recordingError) {
      setError(recordingError instanceof Error ? recordingError.message : "Impossible d'accéder au micro.");
      setState("idle");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") {
      setState("transcribing");
      recorderRef.current.stop();
    }
  }

  async function transcribe(audio: Blob) {
    if (audio.size <= 0) {
      setState("idle");
      setError("Le mémo est vide. Réessaie en parlant un peu plus près du micro.");
      return;
    }

    try {
      const text = await transcribeVoiceMemo({ audio, language });
      setTranscript(text);
    } catch (transcriptionError) {
      setError(transcriptionError instanceof Error ? transcriptionError.message : "Transcription impossible.");
    } finally {
      setState("idle");
    }
  }

  async function copyTranscript() {
    if (!transcript) return;

    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Copie impossible depuis ce navigateur.");
    }
  }

  return (
    <section className="rounded-[10px] border border-border bg-panel p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-[13px] font-semibold text-foreground">Mémo vocal</p>
          <p className="m-0 mt-1 text-[12.5px] leading-5 text-muted">Capture une idée parlée, puis ajoute la transcription au brief.</p>
        </div>
        {isRecording ? (
          <Button leftIcon={<Square />} onClick={stopRecording} type="button" variant="primary">
            Stop {formatElapsed(elapsedSeconds)}
          </Button>
        ) : (
          <Button disabled={isTranscribing || isUnsupported} leftIcon={isTranscribing ? <Loader2 className="animate-spin" /> : <Mic />} onClick={startRecording} type="button" variant="ghost">
            {isTranscribing ? "Transcription..." : "Enregistrer"}
          </Button>
        )}
      </div>

      {isRecording ? (
        <div className="mt-3 flex items-center gap-2 rounded-[8px] border border-[color-mix(in_oklab,var(--danger)_24%,var(--line))] bg-[color-mix(in_oklab,var(--danger)_7%,var(--bg))] px-3 py-2 text-[12.5px] text-[var(--danger)]">
          <span className="size-2 rounded-full bg-[var(--danger)]" />
          Enregistrement en cours
        </div>
      ) : null}

      {transcript ? (
        <div className="mt-3 rounded-[8px] border border-border bg-surface p-3">
          <p className="m-0 whitespace-pre-wrap text-[13px] leading-6 text-foreground">{transcript}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button leftIcon={<Plus />} onClick={() => onInsert(transcript)} size="sm" type="button" variant="primary">
              Ajouter au brief
            </Button>
            <Button leftIcon={<Clipboard />} onClick={copyTranscript} size="sm" type="button" variant="ghost">
              {copied ? "Copié" : "Copier"}
            </Button>
          </div>
        </div>
      ) : null}

      {error ? <div className="mt-3"><Alert>{error}</Alert></div> : null}
    </section>
  );
}
