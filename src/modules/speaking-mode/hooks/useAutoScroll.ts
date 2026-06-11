"use client";

import { RefObject, useCallback, useEffect, useState } from "react";
import type { SpeakingItem } from "../types";

type UseAutoScrollArgs = {
  containerRef: RefObject<HTMLDivElement | null>;
  itemRefs: RefObject<Record<string, HTMLElement | null>>;
  items: SpeakingItem[];
  isPlaying: boolean;
  speed: number;
  fontSize: number;
  markerRatio?: number;
  onEnd?: () => void;
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
  fontSize,
  markerRatio = 0.42,
  onEnd
}: UseAutoScrollArgs) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [virtualOffset, setVirtualOffset] = useState(0);

  const recompute = useCallback(() => {
    const container = getScrollContainer(containerRef);
    if (!container) return;

    const marker = container.getBoundingClientRect().top + container.clientHeight * markerRatio;
    let bestIndex = 0;
    let bestDistance = Infinity;

    items.forEach((item, index) => {
      const element = itemRefs.current[item.id];
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const virtualTop = rect.top - virtualOffset;
      const virtualBottom = rect.bottom - virtualOffset;
      const distance = Math.abs((virtualTop + virtualBottom) / 2 - marker);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    setCurrentIndex((current) => (current === bestIndex ? current : bestIndex));

    const maxScroll = container.scrollHeight - container.clientHeight;
    setProgress(maxScroll > 0 ? virtualOffset / maxScroll : 0);
  }, [containerRef, itemRefs, items, markerRatio, virtualOffset]);

  const scrollToItem = useCallback(
    (index: number) => {
      const container = containerRef.current;
      const item = items[index];
      const element = item ? itemRefs.current[item.id] : null;
      if (!container || !element) return;

      setVirtualOffset(Math.max(0, element.offsetTop - container.clientHeight * markerRatio));
    },
    [containerRef, itemRefs, items, markerRatio]
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
      if (targetIndex >= 0) scrollToItem(targetIndex);
    },
    [currentIndex, items, scrollToItem]
  );

  useEffect(() => {
    const animationFrame = requestAnimationFrame(recompute);
    return () => cancelAnimationFrame(animationFrame);
  }, [recompute]);

  useEffect(() => {
    if (!isPlaying) return;

    let animationFrame = 0;
    let last = performance.now();

    function loop(now: number) {
      const activeContainer = getScrollContainer(containerRef);
      const deltaSeconds = (now - last) / 1000;
      last = now;

      if (activeContainer) {
        const maxScroll = Math.max(0, activeContainer.scrollHeight - activeContainer.clientHeight);
        setVirtualOffset((current) => {
          const next = Math.min(maxScroll, current + fontSize * 0.62 * speed * deltaSeconds);
          if (next >= maxScroll - 1) onEnd?.();
          return next;
        });
      }

      recompute();
      animationFrame = requestAnimationFrame(loop);
    }

    animationFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrame);
  }, [containerRef, fontSize, isPlaying, onEnd, recompute, speed]);

  return { currentIndex, progress, recompute, scrollToItem, jumpSection, virtualOffset };
}
