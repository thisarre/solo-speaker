"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { buildSpeakingItems } from "../lib/buildSpeakingItems";
import { estimateDuration } from "../lib/estimateDuration";
import { formatTime } from "../lib/formatTime";
import { useAutoScroll } from "../hooks/useAutoScroll";
import { useSpeakingKeyboard } from "../hooks/useSpeakingKeyboard";
import { useSpeakingTimer } from "../hooks/useSpeakingTimer";
import { useVoiceFollow } from "../voice/use-voice-follow";
import { useVoiceActivity } from "../voice/use-voice-activity";
import { getVoiceFollowScrollTop } from "../voice/scroll-controller";
import { getVoicePacedScrollSpeed } from "../voice/voice-paced-scroll";
import { SpeakingControls } from "./SpeakingControls";
import { Teleprompter } from "./Teleprompter";
import type { ReadingPosition, SpeakingItem, SpeakingModeProps } from "../types";
import {
  readPrompterFontSizePreference,
  readPrompterSpeedPreference,
  readPrompterThemePreference
} from "@/modules/settings/studio-preferences";
import { useI18n } from "@/i18n/client";
import { localizedPath } from "@/i18n/routing";

const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4];
const fontSizes = [32, 40, 48, 56];
const readingPositions: ReadingPosition[] = ["high", "center", "low"];
const readingPositionRatios: Record<ReadingPosition, number> = {
  high: 0.32,
  center: 0.42,
  low: 0.52
};

function nearestIndex<T>(items: T[], value: T) {
  const index = items.indexOf(value);
  return index >= 0 ? index : 0;
}

export function SpeakingMode({ talk }: SpeakingModeProps) {
  const { locale, messages } = useI18n();
  const copy = messages.speakingMode;
  const router = useRouter();
  const items = useMemo(() => buildSpeakingItems(talk, messages.editor.untitled), [messages.editor.untitled, talk]);
  const totalSeconds = useMemo(() => estimateDuration(items), [items]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLElement | null>>({});
  const elapsedSecondsRef = useRef(0);
  const sessionSentRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(() => nearestIndex(speeds, readPrompterSpeedPreference()));
  const [fontSizeIndex, setFontSizeIndex] = useState(() => nearestIndex(fontSizes, readPrompterFontSizePreference()));
  const [readingPosition, setReadingPosition] = useState<ReadingPosition>("center");
  const [theme, setTheme] = useState<"dark" | "light">(() => readPrompterThemePreference());
  const [voiceFollowActive, setVoiceFollowActive] = useState(false);
  const [voiceScrollSource, setVoiceScrollSource] = useState<"auto-scroll" | "manual" | "transcript-sync" | "voice-paced">("auto-scroll");
  const { elapsedSeconds, reset } = useSpeakingTimer(isPlaying);
  useEffect(() => {
    elapsedSecondsRef.current = elapsedSeconds;
  }, [elapsedSeconds]);
  const speed = speeds[speedIndex];
  const fontSize = fontSizes[fontSizeIndex];
  const readingAnchorRatio = readingPositionRatios[readingPosition];
  const classicAutoScrollEnabled = isPlaying && !voiceFollowActive;

  const sendSession = useCallback(() => {
    if (sessionSentRef.current) return;
    const elapsed = elapsedSecondsRef.current;
    if (elapsed < 30) return;
    sessionSentRef.current = true;
    const payload = JSON.stringify({
      talkId: talk.id,
      durationSeconds: elapsed,
      estimatedSeconds: totalSeconds > 0 ? totalSeconds : null,
      startedAt: new Date(Date.now() - elapsed * 1000).toISOString()
    });
    const url = "/api/analytics/rehearsal/sessions";
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
    } else {
      fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
    }
  }, [talk.id, totalSeconds]);

  const handleExit = useCallback(() => {
    sendSession();
    router.push(localizedPath(`/talks/${talk.id}`, locale));
  }, [router, talk.id, locale, sendSession]);

  useEffect(() => {
    const onVisibilityChange = () => { if (document.visibilityState === "hidden") sendSession(); };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", sendSession);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", sendSession);
    };
  }, [sendSession]);

  const stopPlaying = useCallback(() => setIsPlaying(false), []);

  const { currentIndex, progress, recompute, jumpSection } = useAutoScroll({
    containerRef,
    itemRefs,
    items,
    isPlaying: classicAutoScrollEnabled,
    speed,
    readingAnchorRatio,
    voiceFollowActive,
    onEnd: stopPlaying
  });
  const voiceFollow = useVoiceFollow(items, talk.language, currentIndex, talk.id);
  const voiceActivity = useVoiceActivity(voiceFollowActive, voiceFollow.state.lastDeltaAt);
  const followStateRef = useRef<{
    confidence: number;
    followedItemId: string | null;
    followedText: string;
    matchedItemId: string | null;
    matchedText: string;
  }>({
    confidence: 0,
    followedItemId: null,
    followedText: "",
    matchedItemId: null,
    matchedText: ""
  });
  const desiredScrollRef = useRef<number | null>(null);
  const appliedScrollRef = useRef<number | null>(null);

  const togglePlay = useCallback(() => setIsPlaying((current) => !current), []);
  const previousSection = useCallback(() => jumpSection(-1), [jumpSection]);
  const nextSection = useCallback(() => jumpSection(1), [jumpSection]);
  const slower = useCallback(() => setSpeedIndex((index) => Math.max(0, index - 1)), []);
  const faster = useCallback(() => setSpeedIndex((index) => Math.min(speeds.length - 1, index + 1)), []);
  const smallerText = useCallback(() => setFontSizeIndex((index) => Math.max(0, index - 1)), []);
  const largerText = useCallback(() => setFontSizeIndex((index) => Math.min(fontSizes.length - 1, index + 1)), []);
  const previousReadingPosition = useCallback(
    () => setReadingPosition((position) => readingPositions[Math.max(0, readingPositions.indexOf(position) - 1)]),
    []
  );
  const nextReadingPosition = useCallback(
    () => setReadingPosition((position) => readingPositions[Math.min(readingPositions.length - 1, readingPositions.indexOf(position) + 1)]),
    []
  );
  const toggleTheme = useCallback(() => setTheme((current) => (current === "dark" ? "light" : "dark")), []);
  const toggleVoiceFollow = useCallback(() => {
    setVoiceFollowActive((current) => !current);
    voiceFollow.toggle();
  }, [voiceFollow]);
  const recalibrateVoiceFollow = useCallback(() => {
    desiredScrollRef.current = containerRef.current?.scrollTop ?? null;
    voiceFollow.recalibrate();
  }, [voiceFollow]);

  useSpeakingKeyboard({
    onTogglePlay: togglePlay,
    onPreviousSection: previousSection,
    onNextSection: nextSection,
    onSlower: slower,
    onFaster: faster,
    onSmallerText: smallerText,
    onLargerText: largerText,
    onExit: handleExit,
    onToggleVoiceFollow: toggleVoiceFollow
  });

  useEffect(() => {
    followStateRef.current = {
      confidence: voiceFollow.state.confidence,
      followedItemId: voiceFollow.state.followedItemId,
      followedText: voiceFollow.state.followedText,
      matchedItemId: voiceFollow.state.matchedItemId,
      matchedText: voiceFollow.state.matchedText
    };
  }, [voiceFollow.state.confidence, voiceFollow.state.followedItemId, voiceFollow.state.followedText, voiceFollow.state.matchedItemId, voiceFollow.state.matchedText]);

  // Single owner of the scroll position while voice-follow is on. It eases the container toward one
  // forward-only target: anchored on the matched text block when we have a confident match, and a
  // gentle speaking-paced creep otherwise. Forward-only + single-loop kills both the
  // freeze-at-block-end and the up/down oscillation between neighbouring blocks.
  useEffect(() => {
    if (!voiceFollowActive) {
      desiredScrollRef.current = null;
      appliedScrollRef.current = null;
      const timeoutId = window.setTimeout(() => setVoiceScrollSource("auto-scroll"), 0);
      return () => window.clearTimeout(timeoutId);
    }

    desiredScrollRef.current = containerRef.current?.scrollTop ?? 0;
    appliedScrollRef.current = containerRef.current?.scrollTop ?? 0;
    let animationFrame = 0;
    let last = performance.now();

    function loop(now: number) {
      const container = containerRef.current;
      const deltaSeconds = (now - last) / 1000;
      last = now;

      if (container) {
        // If the scroll moved without us (the reader grabbed it), yield and re-baseline so we don't
        // yank them back to the auto-follow position.
        if (appliedScrollRef.current !== null && Math.abs(container.scrollTop - appliedScrollRef.current) > 2) {
          desiredScrollRef.current = container.scrollTop;
        }

        const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
        const { confidence, followedItemId, followedText, matchedItemId, matchedText } = followStateRef.current;
        // Anchor on the precisely-locked block when we have it; otherwise engage on the raw best
        // match as soon as it is reasonably confident, so the
        // scroll doesn't wait for full lock-on at the start of every sentence (that was the lag).
        const anchorItemId = followedItemId ?? (matchedItemId && confidence >= 0.6 ? matchedItemId : null);
        const followElement = anchorItemId ? itemRefs.current[anchorItemId] : null;
        const spokenText = followedItemId ? followedText : matchedText;
        let desired = desiredScrollRef.current ?? container.scrollTop;

        if (followElement) {
          const followTarget = getVoiceFollowScrollTop({ container, element: followElement, readingAnchorRatio, spokenText });
          // Only ever move the target forward: a transient re-match on the previous block must not
          // drag the reader back up (that was the oscillation).
          if (followTarget !== null && followTarget > desired) {
            desired = followTarget;
            setVoiceScrollSource("transcript-sync");
          }
        } else {
          const basePxPerSecond = maxScroll / Math.max(1, totalSeconds);
          const pxPerSecond = getVoicePacedScrollSpeed({
            basePxPerSecond,
            isAtEnd: container.scrollTop >= maxScroll - 1,
            isPaused: !isPlaying,
            userSpeedMultiplier: speed,
            voiceStatus: voiceActivity.status
          });
          if (pxPerSecond > 0) {
            desired += pxPerSecond * deltaSeconds;
            setVoiceScrollSource("voice-paced");
          }
        }

        desired = Math.min(maxScroll, Math.max(0, desired));
        desiredScrollRef.current = desired;

        const distance = desired - container.scrollTop;
        if (distance > 0.5) {
          const easedStep = distance * 0.08;
          const maxStep = Math.max(1.4, fontSize * 5.2 * Math.max(0.85, speed * 0.75) * deltaSeconds);
          container.scrollTop = container.scrollTop + Math.min(easedStep, maxStep);
        }
        appliedScrollRef.current = container.scrollTop;

        recompute();
      }

      animationFrame = requestAnimationFrame(loop);
    }

    animationFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrame);
  }, [fontSize, isPlaying, readingAnchorRatio, recompute, speed, totalSeconds, voiceActivity.status, voiceFollowActive]);

  useEffect(() => {
    const storageKey = `solo-speaker:speaking:${talk.id}`;
    let animationFrame = 0;

    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "null") as {
        scrollTop?: number;
        speed?: number;
        fontSize?: number;
        readingPosition?: ReadingPosition;
        theme?: "dark" | "light";
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

        if (saved?.readingPosition && readingPositions.includes(saved.readingPosition)) {
          setReadingPosition(saved.readingPosition);
        }

        if (saved?.theme === "dark" || saved?.theme === "light") {
          setTheme(saved.theme);
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
            fontSize,
            readingPosition,
            theme
          })
        );
      } catch {
        // Ignore persistence failures in private browsing.
      }
    }, 700);

    return () => window.clearInterval(interval);
  }, [fontSize, readingPosition, speed, talk.id, theme]);

  const currentItem: SpeakingItem | undefined = items[currentIndex];
  const currentSection = currentItem ? talk.sections[currentItem.sectionIndex] : talk.sections[0];
  const sectionLabel = items.length
    ? copy.sectionLabel.replace("{current}", String((currentItem?.sectionIndex ?? 0) + 1)).replace("{total}", String(talk.sections.length))
    : copy.noSection;
  const themeVars = useMemo<CSSProperties>(
    () =>
      theme === "light"
        ? ({
            "--speaking-bg": "#fafafb",
            "--speaking-strong": "#17171b",
            "--speaking-muted": "#6f6f7a",
            "--speaking-soft": "#85858f",
            "--speaking-faint": "#a8a8b2",
            "--speaking-line": "#e8e8ec",
            "--speaking-panel": "#ffffff",
            "--speaking-field": "#f4f4f6",
            "--speaking-shadow": "rgba(20, 20, 25, .16)",
            "--speaking-button-hover": "#eeeef2",
            "--speaking-accent": "#6e6cf7",
            "--speaking-button-primary-bg": "#17171b",
            "--speaking-button-primary-text": "#ffffff"
          } as CSSProperties)
        : ({
            "--speaking-bg": "#0e0f12",
            "--speaking-strong": "#ececf1",
            "--speaking-muted": "#90929e",
            "--speaking-soft": "#6f7180",
            "--speaking-faint": "#5f606b",
            "--speaking-line": "#23242b",
            "--speaking-panel": "#16171c",
            "--speaking-field": "#111216",
            "--speaking-shadow": "rgba(0, 0, 0, .5)",
            "--speaking-button-hover": "#1e1f25",
            "--speaking-accent": "#7b79ff",
            "--speaking-button-primary-bg": "#ececf1",
            "--speaking-button-primary-text": "#101114"
          } as CSSProperties),
    [theme]
  );

  return (
    <div
      className="relative z-50 flex h-[100svh] w-full overflow-hidden bg-[var(--speaking-bg)] text-[var(--speaking-strong)]"
      data-speaking-playing={isPlaying}
      data-speaking-theme={theme}
      data-tour="prompter-action"
      style={themeVars}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="grid h-[54px] shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 border-b border-[var(--speaking-line)] px-4 font-mono text-[10px] uppercase tracking-[.08em] text-[var(--speaking-soft)] sm:px-6 sm:text-[11px]">
          <Link className="min-w-0 truncate transition hover:text-[var(--speaking-strong)]" href={localizedPath(`/talks/${talk.id}`, locale)}>
            {talk.title}
          </Link>
          <div className="flex items-baseline justify-center gap-2 whitespace-nowrap text-[14px] tracking-[.04em] text-[var(--speaking-strong)] sm:text-[15px]">
            {formatTime(elapsedSeconds)}
            <span className="text-[11px] text-[var(--speaking-soft)]">/ {formatTime(totalSeconds)}</span>
          </div>
          <span className="min-w-0 truncate text-right">{sectionLabel}</span>
        </header>

        <Teleprompter
          containerRef={containerRef}
          currentIndex={currentIndex}
          fontSize={fontSize}
          followedItemId={voiceFollow.state.followedItemId}
          followedText={voiceFollow.state.followedText}
          itemRefs={itemRefs}
          items={items}
          onScroll={recompute}
          readingAnchorRatio={readingAnchorRatio}
          theme={theme}
        />

        <div className="h-[3px] bg-[var(--speaking-line)]">
          <div className="h-full bg-[var(--speaking-accent)] transition-[width]" style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }} />
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
          onToggleVoiceFollow={toggleVoiceFollow}
          onRecalibrateVoiceFollow={recalibrateVoiceFollow}
          onToggleTheme={toggleTheme}
          onVoiceProviderModeChange={voiceFollow.setProviderMode}
          onNextReadingPosition={nextReadingPosition}
          onPreviousReadingPosition={previousReadingPosition}
          readingPosition={readingPosition}
          speed={speed}
          theme={theme}
          totalSeconds={totalSeconds}
          voiceFollow={{ ...voiceFollow.state, scrollSource: voiceScrollSource, voiceStatus: voiceActivity.status }}
          voiceActivity={voiceActivity}
        />

        <button
          className="sr-only"
          onClick={() => {
            reset();
            containerRef.current?.scrollTo({ top: 0 });
          }}
          type="button"
        >
          {copy.resetTimer}
        </button>

        {currentSection ? <span className="sr-only">{copy.currentSection.replace("{title}", currentSection.heading)}</span> : null}
      </div>
    </div>
  );
}
