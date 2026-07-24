"use client";

import { RefObject } from "react";
import { TalkContent } from "./TalkContent";
import type { SpeakingItem } from "../types";
import { useI18n } from "@/i18n/client";

type TeleprompterProps = {
  containerRef: RefObject<HTMLDivElement | null>;
  itemRefs: RefObject<Record<string, HTMLElement | null>>;
  items: SpeakingItem[];
  currentIndex: number;
  followedItemId?: string | null;
  followedText?: string;
  fontSize: number;
  onScroll: () => void;
  readingAnchorRatio: number;
  theme: "dark" | "light";
};

export function Teleprompter({
  containerRef,
  itemRefs,
  items,
  currentIndex,
  followedItemId,
  followedText = "",
  fontSize,
  onScroll,
  readingAnchorRatio,
  theme
}: TeleprompterProps) {
  const { messages } = useI18n();
  const isLight = theme === "light";

  return (
    <main className="relative min-h-0 flex-1 overflow-hidden">
      <div
        className="h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        data-speaking-scroll
        onScroll={onScroll}
        ref={containerRef}
      >
        <div
          className="pointer-events-none fixed left-7 z-10 h-0.5 w-6 rounded-full bg-[var(--speaking-accent)] md:left-[70px]"
          style={{ top: `${readingAnchorRatio * 100}%` }}
        />
        <div
          className="mx-auto max-w-[920px] px-7 pb-[52vh] pt-[40vh] sm:px-8 sm:pt-[42vh] md:px-[60px]"
          style={{ fontSize }}
        >
          {items.length ? (
            items.map((item, index) => {
              const distance = Math.abs(index - currentIndex);
              const isCurrent = index === currentIndex;
              const isFollowed = item.id === followedItemId;
              const isActive = followedItemId ? isFollowed : isCurrent;
              const itemState = getItemState(index, currentIndex);

              if (item.kind === "heading") {
                return (
                  <div
                    className={`mb-[1em] mt-[2.2em] font-mono text-[.38em] uppercase tracking-[.14em] transition-[color,font-weight] duration-300 ${getHeadingClass({ isActive, isLight, itemState })}`}
                    data-reading-state={itemState}
                    data-speaking-active={isActive ? "true" : undefined}
                    data-voice-following={isFollowed ? "true" : undefined}
                    key={item.id}
                    ref={(element) => {
                      itemRefs.current[item.id] = element;
                    }}
                  >
                    {item.text}
                  </div>
                );
              }

              return (
                <p
                  className={`mb-[1.1em] leading-[1.55] tracking-[0] transition-[color,font-weight] duration-300 ${getBodyClass({ distance, index, isActive, isLight, currentIndex, itemState })}`}
                  data-reading-state={itemState}
                  data-speaking-active={isActive ? "true" : undefined}
                  data-voice-following={isFollowed ? "true" : undefined}
                  key={item.id}
                  ref={(element) => {
                    itemRefs.current[item.id] = element;
                  }}
                >
                  <TalkContent highlightText={isFollowed ? followedText : ""} segments={item.segments} />
                </p>
              );
            })
          ) : (
            <p className={`text-center text-[32px] leading-[1.5] ${isLight ? "text-[#71727a]" : "text-[#83848f]"}`}>
              {messages.speakingMode.noSection}
            </p>
          )}
          <p className={`mt-[3em] text-center text-[.5em] ${isLight ? "text-[#a8a8b2]" : "text-[#3c3d46]"}`}>{messages.speakingMode.endOfTalk}</p>
        </div>
      </div>
      <div className={`pointer-events-none fixed inset-x-0 top-[54px] h-24 bg-gradient-to-b to-transparent from-[var(--speaking-bg)]`} />
      <div className={`pointer-events-none fixed inset-x-0 bottom-[168px] h-28 bg-gradient-to-t to-transparent sm:bottom-[118px] from-[var(--speaking-bg)]`} />
    </main>
  );
}

function getItemState(index: number, currentIndex: number) {
  if (index === currentIndex) return "active";
  if (index === currentIndex - 1) return "previous";
  if (index === currentIndex + 1) return "next";
  if (index > currentIndex + 1 && index <= currentIndex + 3) return "upcoming";
  return index < currentIndex ? "past" : "distant";
}

function getHeadingClass(input: { isActive: boolean; isLight: boolean; itemState: string }) {
  if (input.isActive) return input.isLight ? "font-bold text-[#171717]" : "font-bold text-white";
  if (input.itemState === "next") return input.isLight ? "text-[#5f6068]" : "text-[#8f90a0]";
  if (input.itemState === "previous") return input.isLight ? "text-[#a3a3ad]" : "text-[#5e606b]";
  if (input.itemState === "upcoming") return input.isLight ? "text-[#8a8a93]" : "text-[#767887]";
  return input.isLight ? "text-[#c9c9d1]" : "text-[#3f4049]";
}

function getBodyClass(input: { currentIndex: number; distance: number; index: number; isActive: boolean; isLight: boolean; itemState: string }) {
  if (input.isActive) return input.isLight ? "font-bold text-[#111111]" : "font-bold text-white";
  if (input.distance === 1) {
    if (input.index > input.currentIndex) return input.isLight ? "text-[#4d4f57]" : "text-[#a7a8b4]";
    return input.isLight ? "text-[#a3a3ad]" : "text-[#6a6c78]";
  }
  if (input.itemState === "upcoming") return input.isLight ? "text-[#696b72]" : "text-[#858794]";
  return input.isLight ? "text-[#c4c4cc]" : "text-[#4a4b55]";
}
