"use client";

import { Compass } from "lucide-react";
import {
  getRestartedOnboardingTourState,
  onboardingTourProgressKey,
  onboardingTourRestartEvent,
  onboardingTourStorageKey
} from "@/modules/onboarding/tour";

type RestartGuidedOnboardingButtonProps = {
  compact?: boolean;
  inline?: boolean;
};

export function RestartGuidedOnboardingButton({ compact = false, inline = false }: RestartGuidedOnboardingButtonProps) {
  function restartTour() {
    const nextState = getRestartedOnboardingTourState();
    window.localStorage.removeItem(onboardingTourStorageKey);
    window.localStorage.setItem(onboardingTourProgressKey, String(nextState.stepIndex));
    window.dispatchEvent(new Event(onboardingTourRestartEvent));
  }

  return (
    <button
      aria-label="Relancer la visite guidée"
      className={
        compact
          ? "flex size-10 cursor-pointer items-center justify-center rounded-[10px] text-mute transition hover:bg-surface/70 hover:text-ink"
          : inline
            ? "inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-[8px] border border-line bg-surface px-3 py-2 text-[12.5px] font-semibold text-mute transition hover:-translate-y-0.5 hover:text-ink hover:shadow-[0_10px_24px_rgba(20,20,25,.10)]"
          : "mt-2 hidden h-9 cursor-pointer items-center justify-center gap-2.5 rounded-lg border border-line bg-surface px-2 text-[13px] font-medium text-mute transition hover:-translate-y-0.5 hover:text-ink hover:shadow-[0_8px_22px_rgba(20,20,25,.08)] lg:flex"
      }
      onClick={restartTour}
      type="button"
    >
      <Compass className="size-4" />
      {compact ? null : "Visite guidée"}
    </button>
  );
}
