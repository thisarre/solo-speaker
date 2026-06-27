"use client";

import posthog from "posthog-js";
import { ChevronDown, ChevronUp, LogOut, Mic, MicOff, Minus, Moon, Pause, Play, Plus, Settings2, Sun } from "lucide-react";
import { useState } from "react";
import type { ReadingPosition } from "../types";
import { useI18n } from "@/i18n/client";
import type { VoiceFollowProviderMode, VoiceFollowState } from "@/modules/speaking-mode/voice/types";
import type { VoiceActivitySnapshot } from "@/modules/speaking-mode/voice/voice-pace-engine";

type SpeakingControlsProps = {
  isPlaying: boolean;
  speed: number;
  fontSize: number;
  elapsedSeconds: number;
  totalSeconds: number;
  onTogglePlay: () => void;
  onPreviousSection: () => void;
  onNextSection: () => void;
  onSlower: () => void;
  onFaster: () => void;
  onSmallerText: () => void;
  onLargerText: () => void;
  onExit: () => void;
  onToggleVoiceFollow: () => void;
  onRecalibrateVoiceFollow: () => void;
  onToggleTheme: () => void;
  onVoiceProviderModeChange: (mode: VoiceFollowProviderMode) => void;
  onNextReadingPosition: () => void;
  onPreviousReadingPosition: () => void;
  readingPosition: ReadingPosition;
  theme: "dark" | "light";
  voiceActivity: VoiceActivitySnapshot;
  voiceFollow: VoiceFollowState;
};

function ControlButton({
  label,
  children,
  onClick,
  primary = false,
  className = ""
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  className?: string;
}) {
  return (
    <button
      aria-label={label}
      className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-[12px] font-semibold transition ${primary ? "bg-[var(--speaking-button-primary-bg)] text-[var(--speaking-button-primary-text)] hover:brightness-105" : "bg-transparent text-[var(--speaking-muted)] hover:bg-[var(--speaking-button-hover)] hover:text-[var(--speaking-strong)]"} ${className}`}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

export function SpeakingControls({
  isPlaying,
  speed,
  fontSize,
  onTogglePlay,
  onPreviousSection,
  onNextSection,
  onSlower,
  onFaster,
  onSmallerText,
  onLargerText,
  onExit,
  onToggleVoiceFollow,
  onRecalibrateVoiceFollow,
  onToggleTheme,
  onVoiceProviderModeChange,
  onNextReadingPosition,
  onPreviousReadingPosition,
  readingPosition,
  theme,
  voiceActivity,
  voiceFollow
}: SpeakingControlsProps) {
  const [debugOpen, setDebugOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { messages } = useI18n();
  const copy = messages.speakingMode;
  const voiceLabel = formatVoiceFollowStatus(voiceFollow, copy);
  const voiceActive = voiceFollow.enabled && voiceFollow.status !== "unsupported";

  return (
    <footer className="relative shrink-0 px-3 pb-[max(18px,env(safe-area-inset-bottom))] pt-3 sm:px-4 sm:pb-5 sm:pt-4">
      <div className="flex justify-center">
        <div className="grid w-full max-w-[760px] gap-1.5 rounded-xl border border-[var(--speaking-line)] bg-[var(--speaking-panel)] p-1.5 shadow-[0_8px_30px_var(--speaking-shadow)] sm:w-auto">
          <div className="grid grid-cols-[1fr_52px_1fr] gap-1 sm:flex sm:items-center sm:justify-center">
            <ControlButton label={copy.previousSection} onClick={onPreviousSection} className="w-full sm:w-auto">
              <ChevronUp className="size-4" />
            </ControlButton>
            <ControlButton label={isPlaying ? copy.pause : copy.play} onClick={onTogglePlay} primary className="h-11 min-w-11 rounded-[10px] sm:h-9 sm:min-w-9 sm:rounded-lg">
              {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
            </ControlButton>
            <ControlButton label={copy.nextSection} onClick={onNextSection} className="w-full sm:w-auto">
              <ChevronDown className="size-4" />
            </ControlButton>
          </div>

          <div className="grid grid-cols-3 gap-1 sm:flex sm:flex-wrap sm:items-center sm:justify-center">
            <div className="flex items-center justify-center rounded-lg bg-[var(--speaking-field)]">
              <ControlButton label={copy.slower} onClick={onSlower}>
                <Minus className="size-4" />
              </ControlButton>
              <span className="min-w-10 text-center font-mono text-[11px] text-[var(--speaking-strong)]">{speed.toFixed(2).replace(/0$/, "")}x</span>
              <ControlButton label={copy.faster} onClick={onFaster}>
                <Plus className="size-4" />
              </ControlButton>
            </div>

            <div className="flex items-center justify-center rounded-lg bg-[var(--speaking-field)]">
              <ControlButton label={copy.smallerText} onClick={onSmallerText}>A-</ControlButton>
              <span className="hidden min-w-10 text-center font-mono text-[11px] text-[var(--speaking-strong)] sm:inline">{fontSize}px</span>
              <ControlButton label={copy.largerText} onClick={onLargerText}>A+</ControlButton>
            </div>

            <div className="flex items-center justify-center rounded-lg bg-[var(--speaking-field)]">
              <ControlButton label={copy.higherReadingLine} onClick={onPreviousReadingPosition}>
                <ChevronUp className="size-4" />
              </ControlButton>
              <span className="hidden min-w-14 text-center font-mono text-[10px] uppercase tracking-[.06em] text-[var(--speaking-strong)] md:inline">
                {formatReadingPosition(readingPosition)}
              </span>
              <ControlButton label={copy.lowerReadingLine} onClick={onNextReadingPosition}>
                <ChevronDown className="size-4" />
              </ControlButton>
            </div>

            <div className="col-span-3 grid grid-cols-[44px_minmax(0,1fr)_44px_44px] gap-1 sm:col-span-1 sm:flex sm:items-center sm:justify-center">
              <ControlButton label={copy.voiceFollow} onClick={() => { posthog.capture("voice_follow_toggled", { enabled: !voiceFollow.enabled, provider_mode: voiceFollow.providerMode }); onToggleVoiceFollow(); }} primary={voiceActive}>
                {voiceFollow.enabled ? <Mic className="size-4" /> : <MicOff className="size-4" />}
              </ControlButton>
              <button
                className="min-w-0 truncate rounded-lg bg-[var(--speaking-field)] px-2 text-left font-mono text-[10px] uppercase tracking-[.06em] text-[var(--speaking-soft)]"
                onClick={() => setSettingsOpen((current) => !current)}
                title={`Suivi vocal · ${voiceLabel}`}
                type="button"
              >
                {voiceActive ? voiceLabel : copy.voiceFollow}
              </button>
              <ControlButton label={theme === "light" ? copy.darkMode : copy.lightMode} onClick={onToggleTheme}>
                {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
              </ControlButton>
              <ControlButton label={copy.exit} onClick={onExit}>
                <LogOut className="size-4" />
              </ControlButton>
            </div>
          </div>
        </div>
      </div>
      {settingsOpen ? (
      <div className="mt-2 flex justify-center">
        <div className="grid w-full max-w-[min(760px,calc(100vw-32px))] gap-2 rounded-[10px] border border-[var(--speaking-line)] bg-[var(--speaking-panel)] p-2.5 font-mono text-[10px] uppercase tracking-[.06em] text-[var(--speaking-soft)] shadow-[0_8px_30px_var(--speaking-shadow)] sm:w-auto">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
            <div className="min-w-0 truncate">
              {copy.voiceFollow} · {voiceFollow.userStatusLabel} · {voiceLabel}
              {voiceFollow.interimTranscript ? <span className="ml-2 normal-case tracking-[0] text-[var(--speaking-muted)]">“{voiceFollow.interimTranscript.slice(-80)}”</span> : null}
            </div>
            <select
              aria-label={copy.voiceProviderMode}
              className="h-8 min-w-0 rounded-lg border border-[var(--speaking-line)] bg-[var(--speaking-field)] px-2 font-mono text-[10px] uppercase tracking-[.06em] text-[var(--speaking-strong)] outline-none sm:w-[116px]"
              onChange={(event) => onVoiceProviderModeChange(event.target.value as VoiceFollowProviderMode)}
              value={voiceFollow.providerMode}
            >
              <option value="auto">{copy.providerAuto}</option>
              <option value="browser">{copy.providerBrowser}</option>
              <option value="deepgram">{copy.providerDeepgram}</option>
            </select>
            <ControlButton label={copy.recalibrate} onClick={onRecalibrateVoiceFollow}>
              {copy.recalibrate}
            </ControlButton>
          </div>
          <button className="flex max-w-full items-center gap-2 text-left" onClick={() => setDebugOpen((current) => !current)} type="button">
            <Settings2 className="size-3.5 shrink-0" />
            <span className="truncate">{copy.technicalDetails}</span>
          </button>
          {debugOpen ? (
            <div className="mt-2 grid gap-1 border-t border-[var(--speaking-line)] pt-2 normal-case tracking-[0] text-[var(--speaking-muted)] sm:grid-cols-2">
              <DebugRow label="provider" value={voiceFollow.provider} />
              <DebugRow label="providerHealth" value={voiceFollow.providerHealth} />
              <DebugRow label="status" value={voiceFollow.status} />
              <DebugRow label="voiceStatus" value={`${voiceActivity.status} (transcript)`} />
              <DebugRow label="scrollSource" value={voiceFollow.scrollSource} />
              <DebugRow label="transcript" value={voiceFollow.transcript || "-"} />
              <DebugRow label="quality" value={`${voiceFollow.transcriptQuality.reason} · ${Math.round(voiceFollow.transcriptQuality.commonWordRatio * 100)}%`} />
              <DebugRow label="alternatives" value={voiceFollow.providerTranscriptAlternatives.join(" · ") || "-"} />
              <DebugRow label="matched" value={voiceFollow.matchedItemId ? `${voiceFollow.matchedItemId} (${voiceFollow.matchedIndex ?? "-"})` : "-"} />
              <DebugRow label="confidence" value={`${Math.round(voiceFollow.confidence * 100)}% · ${voiceFollow.searchScope}`} />
              <DebugRow label="reason" value={voiceFollow.reason || "-"} />
              <DebugRow label="currentIndex" value={String(voiceFollow.currentIndex)} />
              <DebugRow label="latency" value={voiceFollow.latencyMs === null ? "-" : `${voiceFollow.latencyMs}ms`} />
              <DebugRow label="lastDeltaAt" value={voiceFollow.lastDeltaAt === null ? "-" : new Date(voiceFollow.lastDeltaAt).toLocaleTimeString()} />
            </div>
          ) : null}
        </div>
      </div>
      ) : null}
    </footer>
  );
}

function formatVoiceFollowStatus(state: VoiceFollowState, copy: ReturnType<typeof import("@/i18n/messages").getMessages>["speakingMode"]) {
  if (state.status === "unsupported") return copy.unsupported;
  if (state.status === "requesting") return copy.requesting;
  if (state.status === "listening") return copy.listening;
  if (state.status === "following") return copy.followingStatus.replace("{confidence}", String(Math.round(state.confidence * 100)));
  if (state.status === "uncertain") return copy.uncertain.replace("{confidence}", String(Math.round(state.confidence * 100)));
  if (state.status === "lost") return copy.lost;
  if (state.status === "error") return `${copy.error}${state.error ? ` · ${state.error}` : ""}`;
  if (state.status === "paused") return copy.paused;
  return copy.disabled;
}

function DebugRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <span className="mr-1 text-[var(--speaking-soft)]">{label}:</span>
      <span className="break-words text-[var(--speaking-strong)]">{value}</span>
    </div>
  );
}

function formatReadingPosition(position: ReadingPosition) {
  if (position === "high") return "haut";
  if (position === "low") return "bas";
  return "centre";
}
