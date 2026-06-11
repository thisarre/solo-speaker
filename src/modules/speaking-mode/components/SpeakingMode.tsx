"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildSpeakingItems } from "../lib/buildSpeakingItems";
import { estimateDuration } from "../lib/estimateDuration";
import { formatTime } from "../lib/formatTime";
import { useAutoScroll } from "../hooks/useAutoScroll";
import { useSpeakingKeyboard } from "../hooks/useSpeakingKeyboard";
import { useSpeakingTimer } from "../hooks/useSpeakingTimer";
import { SpeakingControls } from "./SpeakingControls";
import { Teleprompter } from "./Teleprompter";
import type { SpeakingItem, SpeakingModeProps } from "../types";

const speeds = [0.75, 1, 1.25, 1.5, 1.75];
const fontSizes = [32, 40, 48, 56];

function nearestIndex<T>(items: T[], value: T) {
  const index = items.indexOf(value);
  return index >= 0 ? index : 0;
}

export function SpeakingMode({ talk }: SpeakingModeProps) {
  const router = useRouter();
  const items = useMemo(() => buildSpeakingItems(talk), [talk]);
  const totalSeconds = useMemo(() => estimateDuration(items), [items]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLElement | null>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(1);
  const [fontSizeIndex, setFontSizeIndex] = useState(1);
  const { elapsedSeconds, reset } = useSpeakingTimer(isPlaying);
  const speed = speeds[speedIndex];
  const fontSize = fontSizes[fontSizeIndex];

  const handleExit = useCallback(() => {
    router.push(`/talks/${talk.id}`);
  }, [router, talk.id]);

  const stopPlaying = useCallback(() => setIsPlaying(false), []);

  const { currentIndex, progress, recompute, jumpSection, virtualOffset } = useAutoScroll({
    containerRef,
    itemRefs,
    items,
    isPlaying,
    speed,
    fontSize,
    onEnd: stopPlaying
  });

  const togglePlay = useCallback(() => setIsPlaying((current) => !current), []);
  const previousSection = useCallback(() => jumpSection(-1), [jumpSection]);
  const nextSection = useCallback(() => jumpSection(1), [jumpSection]);
  const slower = useCallback(() => setSpeedIndex((index) => Math.max(0, index - 1)), []);
  const faster = useCallback(() => setSpeedIndex((index) => Math.min(speeds.length - 1, index + 1)), []);
  const smallerText = useCallback(() => setFontSizeIndex((index) => Math.max(0, index - 1)), []);
  const largerText = useCallback(() => setFontSizeIndex((index) => Math.min(fontSizes.length - 1, index + 1)), []);

  useSpeakingKeyboard({
    onTogglePlay: togglePlay,
    onPreviousSection: previousSection,
    onNextSection: nextSection,
    onSlower: slower,
    onFaster: faster,
    onSmallerText: smallerText,
    onLargerText: largerText,
    onExit: handleExit
  });

  useEffect(() => {
    const storageKey = `solo-speaker:speaking:${talk.id}`;
    let animationFrame = 0;

    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "null") as {
        scrollTop?: number;
        speed?: number;
        fontSize?: number;
      } | null;

      if (saved?.scrollTop && containerRef.current) {
        containerRef.current.scrollTop = saved.scrollTop;
      }

      animationFrame = window.requestAnimationFrame(() => {
        if (saved?.speed) {
          setSpeedIndex(nearestIndex(speeds, saved.speed));
        }

        if (saved?.fontSize) {
          setFontSizeIndex(nearestIndex(fontSizes, saved.fontSize));
        }
      });
    } catch {
      // Local storage is an enhancement only.
    }

    return () => window.cancelAnimationFrame(animationFrame);
  }, [talk.id]);

  useEffect(() => {
    const storageKey = `solo-speaker:speaking:${talk.id}`;
    const interval = window.setInterval(() => {
      try {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({
            scrollTop: containerRef.current?.scrollTop ?? 0,
            speed,
            fontSize
          })
        );
      } catch {
        // Ignore persistence failures in private browsing.
      }
    }, 700);

    return () => window.clearInterval(interval);
  }, [fontSize, speed, talk.id]);

  const currentItem: SpeakingItem | undefined = items[currentIndex];
  const currentSection = currentItem ? talk.sections[currentItem.sectionIndex] : talk.sections[0];
  const sectionLabel = items.length ? `Section ${(currentItem?.sectionIndex ?? 0) + 1} · ${talk.sections.length}` : "Aucune section";

  return (
    <div className="fixed inset-0 z-50 flex h-screen overflow-hidden bg-[#0a0b0d] text-[#ececf1]" data-speaking-playing={isPlaying}>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative flex h-[54px] shrink-0 items-center border-b border-[#1a1b20] px-6 font-mono text-[11px] uppercase tracking-[.08em] text-[#5f606b]">
          <Link className="max-w-[30%] truncate transition hover:text-[#ececf1]" href={`/talks/${talk.id}`}>
            {talk.title}
          </Link>
          <div className="absolute left-1/2 flex -translate-x-1/2 items-baseline gap-2 whitespace-nowrap text-[15px] tracking-[.04em] text-[#ececf1]">
            {formatTime(elapsedSeconds)}
            <span className="text-[11px] text-[#5f606b]">/ {formatTime(totalSeconds)}</span>
          </div>
          <span className="ml-auto whitespace-nowrap">{sectionLabel}</span>
        </header>

        <Teleprompter
          containerRef={containerRef}
          currentIndex={currentIndex}
          fontSize={fontSize}
          itemRefs={itemRefs}
          items={items}
          onScroll={recompute}
          virtualOffset={virtualOffset}
        />

        <div className="h-[3px] bg-[#1a1b20]">
          <div className="h-full bg-[#7b79ff] transition-[width]" style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }} />
        </div>

        <SpeakingControls
          elapsedSeconds={elapsedSeconds}
          fontSize={fontSize}
          isPlaying={isPlaying}
          onExit={handleExit}
          onFaster={faster}
          onLargerText={largerText}
          onNextSection={nextSection}
          onPreviousSection={previousSection}
          onSlower={slower}
          onSmallerText={smallerText}
          onTogglePlay={togglePlay}
          speed={speed}
          totalSeconds={totalSeconds}
        />

        <button
          className="sr-only"
          onClick={() => {
            reset();
            containerRef.current?.scrollTo({ top: 0 });
          }}
          type="button"
        >
          Reset timer
        </button>

        {currentSection ? <span className="sr-only">Section courante: {currentSection.heading}</span> : null}
      </div>
    </div>
  );
}
