"use client";

import { RefObject } from "react";
import { TalkContent } from "./TalkContent";
import type { SpeakingItem } from "../types";

type TeleprompterProps = {
  containerRef: RefObject<HTMLDivElement | null>;
  itemRefs: RefObject<Record<string, HTMLElement | null>>;
  items: SpeakingItem[];
  currentIndex: number;
  fontSize: number;
  virtualOffset: number;
  onScroll: () => void;
};

export function Teleprompter({ containerRef, itemRefs, items, currentIndex, fontSize, virtualOffset, onScroll }: TeleprompterProps) {
  return (
    <main className="relative min-h-0 flex-1 overflow-hidden">
      <div
        className="h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        data-speaking-scroll
        onScroll={onScroll}
        ref={containerRef}
      >
        <div className="pointer-events-none fixed left-7 top-[42%] z-10 h-0.5 w-6 rounded-full bg-[#7b79ff] md:left-[70px]" />
        <div
          className="mx-auto max-w-[920px] px-8 pb-[50vh] pt-[42vh] will-change-transform md:px-[60px]"
          style={{ fontSize, transform: `translateY(-${virtualOffset}px)` }}
        >
          {items.length ? (
            items.map((item, index) => {
              const distance = Math.abs(index - currentIndex);

              if (item.kind === "heading") {
                return (
                  <div
                    className={`mb-[1em] mt-[2.2em] font-mono text-[.38em] uppercase tracking-[.14em] ${
                      index === currentIndex ? "text-[#9d9bff]" : "text-[#5f606b]"
                    }`}
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
                  className={`mb-[1.1em] font-normal leading-[1.55] tracking-[0] transition-colors duration-300 ${
                    index === currentIndex ? "text-white" : distance === 1 ? "text-[#83848f]" : "text-[#4a4b55]"
                  }`}
                  key={item.id}
                  ref={(element) => {
                    itemRefs.current[item.id] = element;
                  }}
                >
                  <TalkContent segments={item.segments} />
                </p>
              );
            })
          ) : (
            <p className="text-center text-[32px] leading-[1.5] text-[#83848f]">
              Aucune section à lire.
            </p>
          )}
          <p className="mt-[3em] text-center text-[.5em] text-[#3c3d46]">Fin du talk</p>
        </div>
      </div>
      <div className="pointer-events-none fixed inset-x-0 top-[54px] h-24 bg-gradient-to-b from-[#0a0b0d] to-transparent" />
      <div className="pointer-events-none fixed inset-x-0 bottom-[70px] h-28 bg-gradient-to-t from-[#0a0b0d] to-transparent" />
    </main>
  );
}
