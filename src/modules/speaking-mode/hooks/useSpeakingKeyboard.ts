"use client";

import { useEffect } from "react";

type UseSpeakingKeyboardArgs = {
  onTogglePlay: () => void;
  onPreviousSection: () => void;
  onNextSection: () => void;
  onSlower: () => void;
  onFaster: () => void;
  onSmallerText: () => void;
  onLargerText: () => void;
  onExit: () => void;
  onToggleVoiceFollow?: () => void;
};

export function useSpeakingKeyboard({
  onTogglePlay,
  onPreviousSection,
  onNextSection,
  onSlower,
  onFaster,
  onSmallerText,
  onLargerText,
  onExit,
  onToggleVoiceFollow
}: UseSpeakingKeyboardArgs) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === " ") {
        event.preventDefault();
        onTogglePlay();
      } else if (event.key === "Escape") {
        onExit();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        onPreviousSection();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        onNextSection();
      } else if (event.key === "-") {
        onSlower();
      } else if (event.key === "=" || event.key === "+") {
        onFaster();
      } else if (event.key === "[") {
        onSmallerText();
      } else if (event.key === "]") {
        onLargerText();
      } else if (event.key.toLowerCase() === "v") {
        onToggleVoiceFollow?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExit, onFaster, onLargerText, onNextSection, onPreviousSection, onSlower, onSmallerText, onTogglePlay, onToggleVoiceFollow]);
}
