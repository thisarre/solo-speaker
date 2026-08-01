"use client";

import { Loader2, Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/client";
import { transcribeVoiceMemo } from "@/modules/voice-memo/actions";
import type { TalkLanguage } from "@/types/talk";

type Props = {
  language: TalkLanguage;
  /** Called with the transcript; the editor decides where it lands in the body. */
  onTranscript: (text: string) => void;
  onError: (message: string) => void;
  /** Kept in sync so the editor can lock every other block's mic while this one records. */
  onRecordingChange: (recording: boolean) => void;
  disabled?: boolean;
};

type RecorderState = "idle" | "recording" | "transcribing";

function getSupportedMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const options = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return options.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function formatElapsed(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * Compact dictation control for a single section's toolbar: record → transcribe →
 * insert into that section. Shares the transcription pipeline with the brief's
 * VoiceMemoRecorder; only the surface differs.
 */
export function SectionDictationButton({ language, onTranscript, onError, onRecordingChange, disabled }: Props) {
  const { messages } = useI18n();
  const copy = messages.voiceMemo;
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const isRecording = state === "recording";
  const isTranscribing = state === "transcribing";
  const isUnsupported =
    typeof window !== "undefined" &&
    (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined");

  useEffect(() => {
    if (!isRecording) return;
    const intervalId = window.setInterval(() => setElapsedSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(intervalId);
  }, [isRecording]);

  // Held in a ref so the notify effect keys off `isRecording` alone: an inline
  // callback from the editor would otherwise re-fire it on every parent render.
  const onRecordingChangeRef = useRef(onRecordingChange);

  useEffect(() => {
    onRecordingChangeRef.current = onRecordingChange;
  });

  useEffect(() => {
    onRecordingChangeRef.current(isRecording);
  }, [isRecording]);

  // Releasing the mic on unmount matters here: collapsing a section or leaving the
  // editor mid-recording would otherwise leave the browser's capture indicator on.
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  async function transcribe(audio: Blob) {
    if (audio.size <= 0) {
      setState("idle");
      onError(copy.emptyError);
      return;
    }

    try {
      const text = await transcribeVoiceMemo({ audio, language });
      onTranscript(text);
    } catch (transcriptionError) {
      onError(transcriptionError instanceof Error ? transcriptionError.message : copy.transcriptionError);
    } finally {
      setState("idle");
    }
  }

  async function startRecording() {
    if (isUnsupported) {
      onError(copy.unsupportedError);
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
      onError(recordingError instanceof Error ? recordingError.message : copy.microphoneError);
      setState("idle");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") {
      setState("transcribing");
      recorderRef.current.stop();
    }
  }

  if (isRecording) {
    return (
      <Button
        aria-label={copy.stop}
        className="h-7 shrink-0 gap-1.5 px-2.5 text-[11.5px]"
        onClick={stopRecording}
        size="sm"
        title={copy.recording}
        type="button"
        variant="primary"
      >
        <Square className="size-3.5" />
        {formatElapsed(elapsedSeconds)}
      </Button>
    );
  }

  return (
    <Button
      aria-label={copy.dictateSection}
      className="h-7 shrink-0 px-2"
      disabled={disabled || isTranscribing || isUnsupported}
      onClick={startRecording}
      size="sm"
      title={isUnsupported ? copy.unsupportedHelp : copy.dictateSection}
      type="button"
      variant="quiet"
    >
      {isTranscribing ? <Loader2 className="size-4 animate-spin" /> : <Mic className="size-4" />}
    </Button>
  );
}
