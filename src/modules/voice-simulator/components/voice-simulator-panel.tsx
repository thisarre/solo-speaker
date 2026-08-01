"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, Square, Volume2, X } from "lucide-react";
import { tones, getTone, type ToneId } from "@/modules/voice-simulator/tones";
import { getAudio, prefetchAudio, SpeakError } from "@/modules/voice-simulator/audio-cache";
import { useI18n } from "@/i18n/client";

type Section = {
  id: string;
  heading: string;
  body: string;
};

type Props = {
  sections: Section[];
  activeSectionId: string;
  onSectionChange: (sectionId: string) => void;
  onClose: () => void;
};

type PlayState = "idle" | "loading" | "playing" | "paused" | "error";

function buildSpeakText(section: Section): string {
  const parts: string[] = [];
  if (section.heading.trim()) parts.push(section.heading.trim());
  if (section.body.trim()) {
    parts.push(section.body.replace(/\[pause\s*\d+s\]/gi, ", ").trim());
  }
  return parts.join(". ");
}


export function VoiceSimulatorPanel({ sections, activeSectionId, onSectionChange, onClose }: Props) {
  const { messages } = useI18n();
  const vs = messages.voiceSimulator;
  const [selectedTone, setSelectedTone] = useState<ToneId>("confiant");
  const [playState, setPlayState] = useState<PlayState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Bumped on every stop/new playback: an in-flight synthesis whose token is stale
  // resolves into the cache but never reaches the audio element.
  const playTokenRef = useRef(0);

  const currentIndex = sections.findIndex((s) => s.id === activeSectionId);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentSection = sections[safeIndex];
  const hasNext = safeIndex < sections.length - 1;
  const hasPrev = safeIndex > 0;
  const tone = getTone(selectedTone);
  const isLoading = playState === "loading";
  const isPlaying = playState === "playing";
  const isPaused = playState === "paused";
  const isActive = isPlaying || isPaused || isLoading;

  const stopAudio = useCallback(() => {
    playTokenRef.current += 1;
    const audio = audioRef.current;
    if (audio) {
      audio.onplay = null;
      audio.onpause = null;
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.src = "";
    }
    audioRef.current = null;
    setPlayState("idle");
    setErrorMsg("");
  }, []);

  useEffect(() => () => { stopAudio(); }, [stopAudio]);

  const messageForError = useCallback((err: unknown) => {
    const byCode: Record<string, string> = {
      quota_exceeded: vs.quotaError,
      voice_unavailable: vs.voiceUnavailableError,
      provider_busy: vs.busyError
    };
    return (err instanceof SpeakError && byCode[err.code]) || vs.playbackError;
  }, [vs.playbackError, vs.quotaError, vs.voiceUnavailableError, vs.busyError]);

  const playSection = useCallback(async (
    section: Section,
    toneId: ToneId,
    onEnded?: () => void,
    nextSection?: Section
  ) => {
    stopAudio();
    setPlayState("loading");
    setErrorMsg("");

    const text = buildSpeakText(section);
    if (!text) { setPlayState("idle"); onEnded?.(); return; }

    const token = (playTokenRef.current += 1);
    const isStale = () => playTokenRef.current !== token;

    try {
      const blob = await getAudio(text, toneId);
      if (isStale()) return;

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => setPlayState("playing");
      audio.onpause = () => { if (!audio.ended) setPlayState("paused"); };
      audio.onended = () => { URL.revokeObjectURL(url); setPlayState("idle"); onEnded?.(); };
      audio.onerror = () => { URL.revokeObjectURL(url); setErrorMsg(vs.playbackError); setPlayState("error"); };

      await audio.play();

      // Warm the next block only once this one is audible, so the two requests
      // never compete — by the time playback ends, the next blob is in cache.
      if (!isStale() && nextSection) prefetchAudio(buildSpeakText(nextSection), toneId);
    } catch (err) {
      if (isStale()) return;
      setErrorMsg(messageForError(err));
      setPlayState("error");
    }
  }, [stopAudio, messageForError, vs.playbackError]);

  // Recurse through `playFromRef` (kept in sync below) so this memoized callback never references its
  // own binding before initialization (TDZ) — used to auto-advance to the next section on audio end.
  const playFromRef = useRef<(index: number, tone: ToneId, allSections: Section[]) => void>(() => {});

  const playFrom = useCallback((index: number, tone: ToneId, allSections: Section[]) => {
    const section = allSections[index];
    if (!section) return;
    onSectionChange(section.id);
    const next = allSections[index + 1];
    playSection(
      section,
      tone,
      next ? () => playFromRef.current(index + 1, tone, allSections) : undefined,
      next
    );
  }, [onSectionChange, playSection]);

  useEffect(() => {
    playFromRef.current = playFrom;
  }, [playFrom]);

  // No idle warm-up on the displayed block: measured on 2026-08-01, browsing
  // sections and tone chips billed ~2.8k characters for three short blocks that
  // were barely listened to. Synthesis now only happens for audio that plays —
  // the current block on demand, the next one while the current is audible.

  const handlePlay = () => {
    if (!currentSection) return;
    if (isPaused && audioRef.current) { audioRef.current.play().catch(() => setPlayState("error")); return; }
    playFrom(safeIndex, selectedTone, sections);
  };

  const handleNext = () => {
    if (!hasNext) return;
    const nextIndex = safeIndex + 1;
    const nextSection = sections[nextIndex];
    if (!nextSection) return;
    if (isActive) {
      playFrom(nextIndex, selectedTone, sections);
    } else {
      stopAudio();
      onSectionChange(nextSection.id);
    }
  };

  const handlePrev = () => {
    if (!hasPrev) return;
    stopAudio();
    const prev = sections[safeIndex - 1];
    if (prev) onSectionChange(prev.id);
  };

  const handleToneChange = (id: ToneId) => {
    setSelectedTone(id);
    if (isActive) stopAudio();
  };

  const toneLabel = vs.tones[tone.id]?.label ?? tone.id;

  return (
    <div className="border-t border-border bg-background/95 backdrop-blur-md">
      {/* Tone chips row */}
      <div className="flex items-center gap-1.5 border-b border-border pl-4 pr-4 py-2 md:pr-44">
        <span className="mr-1 font-mono text-[10px] uppercase tracking-[.12em] text-faint">{vs.toneLabel}</span>
        {tones.map((t) => {
          const label = vs.tones[t.id]?.label ?? t.id;
          const active = selectedTone === t.id;
          return (
            <button
              className={`h-6 rounded-full px-2.5 text-[11.5px] font-[550] transition ${
                active
                  ? "bg-accent text-white"
                  : "bg-panel text-muted hover:bg-surface hover:text-foreground"
              }`}
              key={t.id}
              onClick={() => handleToneChange(t.id)}
              type="button"
            >
              {label}
            </button>
          );
        })}
        {playState === "error" ? (
          <span className="ml-2 text-[11.5px] text-[var(--danger)]">{errorMsg}</span>
        ) : null}
      </div>

      {/* Player bar — pr-44 clears the fixed help-widget on the right */}
      <div className="flex h-14 items-center gap-3 pl-4 pr-4 md:pr-44">
        {/* Playing animation + section info */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {isPlaying ? (
            <div className="flex shrink-0 items-end gap-[3px]" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="inline-block w-[3px] rounded-full bg-accent"
                  style={{
                    height: "14px",
                    animation: "voice-bar 0.75s ease-in-out infinite",
                    animationDelay: `${i * 0.12}s`
                  }}
                />
              ))}
            </div>
          ) : (
            <Volume2 className="size-4 shrink-0 text-faint" />
          )}
          <div className="min-w-0">
            <p className="m-0 truncate text-[13px] font-[550] text-foreground">
              {currentSection?.heading || vs.untitled}
            </p>
            <p className="m-0 font-mono text-[10.5px] text-faint">
              {isPlaying ? (
                <span className="text-accent-ink">{toneLabel} · {vs.reading}</span>
              ) : isLoading ? (
                vs.loading
              ) : (
                <span>{safeIndex + 1}/{sections.length}</span>
              )}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            className="flex size-8 items-center justify-center rounded-[7px] text-muted transition hover:bg-panel hover:text-foreground disabled:opacity-30"
            disabled={!hasPrev}
            onClick={handlePrev}
            title={vs.prev}
            type="button"
          >
            <ChevronLeft className="size-4" />
          </button>

          {isPlaying ? (
            <button
              className="flex h-8 items-center gap-1.5 rounded-[8px] bg-accent px-3 text-[12.5px] font-[550] text-white transition hover:opacity-90"
              onClick={() => audioRef.current?.pause()}
              type="button"
            >
              <Pause className="size-3.5" />
              {vs.pause}
            </button>
          ) : (
            <button
              className="flex h-8 items-center gap-1.5 rounded-[8px] bg-accent px-3 text-[12.5px] font-[550] text-white transition hover:opacity-90 disabled:opacity-50"
              disabled={isLoading || !currentSection}
              onClick={handlePlay}
              type="button"
            >
              {isLoading ? (
                <span className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Play className="size-3.5" />
              )}
              {isLoading ? vs.loading : isPaused ? vs.resume : vs.play}
            </button>
          )}

          {isActive ? (
            <button
              className="flex size-8 items-center justify-center rounded-[7px] text-muted transition hover:bg-panel hover:text-foreground"
              onClick={stopAudio}
              title={vs.stop}
              type="button"
            >
              <Square className="size-3.5" />
            </button>
          ) : null}

          <button
            className="flex size-8 items-center justify-center rounded-[7px] text-muted transition hover:bg-panel hover:text-foreground disabled:opacity-30"
            disabled={!hasNext}
            onClick={handleNext}
            title={vs.next}
            type="button"
          >
            <ChevronRight className="size-4" />
          </button>

          <div className="mx-1 h-5 w-px bg-border" />

          <button
            className="flex size-8 items-center justify-center rounded-[7px] text-faint transition hover:bg-panel hover:text-foreground"
            onClick={onClose}
            title={vs.close}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
