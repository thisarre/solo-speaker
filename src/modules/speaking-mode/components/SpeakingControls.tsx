"use client";

import { ChevronDown, ChevronUp, LogOut, Minus, Pause, Play, Plus } from "lucide-react";
import { formatTime } from "../lib/formatTime";

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
};

function ControlButton({
  label,
  children,
  onClick,
  primary = false
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      aria-label={label}
      className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-[12px] font-semibold transition ${
        primary
          ? "bg-[#ececf1] text-[#101114] hover:bg-white"
          : "bg-transparent text-[#9092a0] hover:bg-[#1e1f25] hover:text-[#ececf1]"
      }`}
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
  elapsedSeconds,
  totalSeconds,
  onTogglePlay,
  onPreviousSection,
  onNextSection,
  onSlower,
  onFaster,
  onSmallerText,
  onLargerText,
  onExit
}: SpeakingControlsProps) {
  return (
    <footer className="relative shrink-0 px-4 pb-6 pt-5">
      <div className="flex justify-center">
        <div className="flex items-center gap-1 rounded-xl border border-[#23242b] bg-[#141519] p-1.5 shadow-[0_8px_30px_rgba(0,0,0,.5)]">
          <ControlButton label="Section précédente" onClick={onPreviousSection}>
            <ChevronUp className="size-4" />
          </ControlButton>
          <ControlButton label={isPlaying ? "Pause" : "Lecture"} onClick={onTogglePlay} primary>
            {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
          </ControlButton>
          <ControlButton label="Section suivante" onClick={onNextSection}>
            <ChevronDown className="size-4" />
          </ControlButton>
          <span className="mx-1 h-5 w-px bg-[#23242b]" />
          <ControlButton label="Ralentir" onClick={onSlower}>
            <Minus className="size-4" />
          </ControlButton>
          <span className="min-w-11 text-center font-mono text-[11px] text-[#ececf1]">{speed.toFixed(2).replace(/0$/, "")}x</span>
          <ControlButton label="Accélérer" onClick={onFaster}>
            <Plus className="size-4" />
          </ControlButton>
          <span className="mx-1 h-5 w-px bg-[#23242b]" />
          <ControlButton label="Réduire le texte" onClick={onSmallerText}>A-</ControlButton>
          <span className="min-w-10 text-center font-mono text-[11px] text-[#ececf1]">{fontSize}px</span>
          <ControlButton label="Agrandir le texte" onClick={onLargerText}>A+</ControlButton>
          <span className="mx-1 h-5 w-px bg-[#23242b]" />
          <ControlButton label="Quitter" onClick={onExit}>
            <LogOut className="size-4" />
          </ControlButton>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-2 right-4 hidden font-mono text-[10px] uppercase tracking-[.06em] text-[#3c3d46] lg:block">
        espace lecture · ↑↓ sections · +/- vitesse · [] taille · esc quitter
      </div>
      <div className="absolute bottom-2 left-4 font-mono text-[10px] uppercase tracking-[.06em] text-[#5f606b]">
        {formatTime(elapsedSeconds)} / {formatTime(totalSeconds)}
      </div>
    </footer>
  );
}
