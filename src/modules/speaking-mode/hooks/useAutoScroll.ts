"use client";

import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { canAutoScroll, nextScrollTop } from "../lib/auto-scroll-logic";
import type { SpeakingItem } from "../types";

type UseAutoScrollArgs = {
  containerRef: RefObject<HTMLDivElement | null>;
  itemRefs: RefObject<Record<string, HTMLElement | null>>;
  items: SpeakingItem[];
  isPlaying: boolean;
  speed: number;
  markerRatio?: number;
  onEnd?: () => void;
  readingAnchorRatio?: number;
  voiceFollowActive?: boolean;
};

type ScrollToItemOptions = {
  align?: "anchor" | "center" | "marker";
  smooth?: boolean;
};

function getScrollContainer(containerRef: RefObject<HTMLDivElement | null>) {
  return containerRef.current ?? document.querySelector<HTMLDivElement>("[data-speaking-scroll]");
}

export function useAutoScroll({
  containerRef,
  itemRefs,
  items,
  isPlaying,
  speed,
  markerRatio = 0.42,
  onEnd,
  readingAnchorRatio = 0.42,
  voiceFollowActive = false
}: UseAutoScrollArgs) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const animationRef = useRef(0);
  const scrollOffsetRef = useRef(0);

  useEffect(() => {
    scrollOffsetRef.current = scrollOffset;
  }, [scrollOffset]);

  const recompute = useCallback(() => {
    const container = getScrollContainer(containerRef);
    if (!container) return;

    const marker = container.getBoundingClientRect().top + container.clientHeight * readingAnchorRatio;
    let bestIndex = 0;
    let bestDistance = Infinity;

    items.forEach((item, index) => {
      const element = itemRefs.current[item.id];
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const distance = Math.abs((rect.top + rect.bottom) / 2 - marker);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    setCurrentIndex((current) => (current === bestIndex ? current : bestIndex));

    const maxScroll = container.scrollHeight - container.clientHeight;
    const nextOffset = container.scrollTop;
    scrollOffsetRef.current = nextOffset;
    setScrollOffset(nextOffset);
    setProgress(maxScroll > 0 ? nextOffset / maxScroll : 0);
  }, [containerRef, itemRefs, items, readingAnchorRatio]);

  const scrollToItem = useCallback(
    (index: number, options: ScrollToItemOptions = {}) => {
      const container = containerRef.current;
      const item = items[index];
      const element = item ? itemRefs.current[item.id] : null;
      if (!container || !element) return;

      const scrollContainer = container;
      const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
      const target =
        options.align === "anchor"
          ? Math.min(
              maxScroll,
              Math.max(
                0,
                container.scrollTop +
                  element.getBoundingClientRect().top -
                  container.getBoundingClientRect().top +
                  element.offsetHeight * 0.5 -
                  container.clientHeight * readingAnchorRatio
              )
            )
          : Math.min(
              maxScroll,
              Math.max(
                0,
                element.offsetTop + element.offsetHeight * 0.5 - container.clientHeight * (options.align === "center" ? 0.5 : markerRatio)
              )
            );

      cancelAnimationFrame(animationRef.current);

      if (!options.smooth) {
        scrollContainer.scrollTop = target;
        scrollOffsetRef.current = target;
        setScrollOffset(target);
        setCurrentIndex(index);
        setProgress(maxScroll > 0 ? target / maxScroll : 0);
        return;
      }

      const start = scrollContainer.scrollTop;
      const distance = target - start;
      const startedAt = performance.now();
      const duration =
        options.align === "anchor"
          ? Math.min(360, Math.max(120, Math.abs(distance) * 0.28))
          : Math.min(620, Math.max(220, Math.abs(distance) * 0.45));

      function animate(now: number) {
        const t = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const next = start + distance * eased;

        scrollContainer.scrollTop = next;
        scrollOffsetRef.current = next;
        setScrollOffset(next);
        setProgress(maxScroll > 0 ? next / maxScroll : 0);

        if (t < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setCurrentIndex(index);
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    },
    [containerRef, itemRefs, items, markerRatio, readingAnchorRatio]
  );

  const jumpSection = useCallback(
    (direction: -1 | 1) => {
      const currentSectionIndex = items[currentIndex]?.sectionIndex ?? 0;
      const targetSectionIndex = Math.max(
        0,
        Math.min(
          Math.max(0, ...items.map((item) => item.sectionIndex)),
          currentSectionIndex + direction
        )
      );
      const targetIndex = items.findIndex((item) => item.kind === "heading" && item.sectionIndex === targetSectionIndex);
      if (targetIndex >= 0) scrollToItem(targetIndex, { smooth: true });
    },
    [currentIndex, items, scrollToItem]
  );

  useEffect(() => {
    const animationFrame = requestAnimationFrame(recompute);
    return () => cancelAnimationFrame(animationFrame);
  }, [recompute]);

  useEffect(() => {
    if (!isPlaying) return;

    cancelAnimationFrame(animationRef.current);

    let animationFrame = 0;
    let last = performance.now();
    // Accumulate the scroll position as a float. The browser rounds element.scrollTop to an
    // integer, so reading it back as the base each frame discards sub-pixel progress — which
    // stalls slow speeds (< ~1px/frame, e.g. 0.75x) entirely while the timer keeps running.
    let scrollFloat = getScrollContainer(containerRef)?.scrollTop ?? 0;

    function loop(now: number) {
      const activeContainer = getScrollContainer(containerRef);
      const deltaSeconds = (now - last) / 1000;
      last = now;

      if (activeContainer) {
        const maxScroll = Math.max(0, activeContainer.scrollHeight - activeContainer.clientHeight);
        if (canAutoScroll({
          clientHeight: activeContainer.clientHeight,
          isPlaying,
          scrollHeight: activeContainer.scrollHeight,
          scrollTop: activeContainer.scrollTop,
          voiceFollowActive
        })) {
          // Re-baseline if the reader manually scrolled (diverged beyond integer-rounding noise).
          if (Math.abs(activeContainer.scrollTop - scrollFloat) > 2) {
            scrollFloat = activeContainer.scrollTop;
          }
          scrollFloat = nextScrollTop({
            clientHeight: activeContainer.clientHeight,
            deltaSeconds,
            scrollHeight: activeContainer.scrollHeight,
            scrollTop: scrollFloat,
            speedMultiplier: speed
          });
          activeContainer.scrollTop = scrollFloat;
          scrollOffsetRef.current = scrollFloat;
          setScrollOffset(scrollFloat);
          setProgress(maxScroll > 0 ? scrollFloat / maxScroll : 0);
          if (scrollFloat >= maxScroll - 1) onEnd?.();
        } else {
          setProgress(maxScroll > 0 ? activeContainer.scrollTop / maxScroll : 0);
        }
      }

      recompute();
      animationFrame = requestAnimationFrame(loop);
    }

    animationFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrame);
  }, [containerRef, isPlaying, onEnd, recompute, speed, voiceFollowActive]);

  useEffect(() => () => cancelAnimationFrame(animationRef.current), []);

  return { currentIndex, progress, recompute, scrollToItem, jumpSection, virtualOffset: scrollOffset };
}
