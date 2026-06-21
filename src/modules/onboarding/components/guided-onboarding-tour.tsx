"use client";

import Link from "next/link";
import { ArrowRight, Check, Compass, MousePointer2, X } from "lucide-react";
import { useEffect, useMemo, useReducer, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  getOnboardingTourProgress,
  getRestartedOnboardingTourState,
  onboardingTourProgressKey,
  onboardingTourRestartEvent,
  onboardingTourSteps,
  onboardingTourStorageKey,
  resolveOnboardingTourStepHref
} from "@/modules/onboarding/tour";

type GuidedOnboardingTourProps = {
  enabled: boolean;
  latestTalkId?: string | null;
};

type TargetRect = {
  height: number;
  left: number;
  top: number;
  width: number;
};

function readStoredProgress() {
  if (typeof window === "undefined") return 0;
  return getOnboardingTourProgress(Number(window.localStorage.getItem(onboardingTourProgressKey) ?? 0));
}

function readCompleted() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(onboardingTourStorageKey) === "completed";
}

export function GuidedOnboardingTour({ enabled, latestTalkId }: GuidedOnboardingTourProps) {
  const [hydrated, hydrate] = useReducer(() => true, false);
  const [completed, setCompleted] = useState(readCompleted);
  const [stepIndex, setStepIndex] = useState(readStoredProgress);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);

  useEffect(hydrate, [hydrate]);

  useEffect(() => {
    if (!hydrated || completed) return;

    let frameId = 0;
    const updateTarget = (shouldScroll = false) => {
      const target = document.querySelector<HTMLElement>(onboardingTourSteps[stepIndex]?.target ?? "");

      if (!target) {
        setTargetRect(null);
        return;
      }

      if (shouldScroll) {
        target.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      }

      const rect = target.getBoundingClientRect();
      setTargetRect({
        height: rect.height,
        left: rect.left,
        top: rect.top,
        width: rect.width
      });
    };

    const updateTargetPosition = () => updateTarget(false);

    frameId = window.requestAnimationFrame(() => updateTarget(true));
    window.addEventListener("resize", updateTargetPosition);
    window.addEventListener("scroll", updateTargetPosition, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updateTargetPosition);
      window.removeEventListener("scroll", updateTargetPosition, true);
    };
  }, [completed, hydrated, stepIndex]);

  useEffect(() => {
    if (!hydrated) return;

    function handleRestartTour() {
      const nextState = getRestartedOnboardingTourState();
      setCompleted(nextState.completed);
      setStepIndex(nextState.stepIndex);
    }

    window.addEventListener(onboardingTourRestartEvent, handleRestartTour);
    return () => window.removeEventListener(onboardingTourRestartEvent, handleRestartTour);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || completed) return;
    window.localStorage.setItem(onboardingTourProgressKey, String(stepIndex));
  }, [completed, hydrated, stepIndex]);

  const step = onboardingTourSteps[stepIndex];
  const isLastStep = stepIndex === onboardingTourSteps.length - 1;
  const progressLabel = `${stepIndex + 1}/${onboardingTourSteps.length}`;
  const currentHref = useMemo(() => resolveOnboardingTourStepHref(step, { latestTalkId }), [latestTalkId, step]);
  const panelPosition = targetRect && targetRect.top < window.innerHeight * 0.52 ? "bottom" : "top";

  if (!enabled || !hydrated || completed || !step) return null;

  function finishTour() {
    window.localStorage.setItem(onboardingTourStorageKey, "completed");
    setCompleted(true);
  }

  function nextStep() {
    if (isLastStep) {
      finishTour();
      return;
    }

    setStepIndex((current) => getOnboardingTourProgress(current + 1));
  }

  function previousStep() {
    setStepIndex((current) => getOnboardingTourProgress(current - 1));
  }

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-40 bg-ink/28 backdrop-blur-[1px]" />
      {targetRect ? (
        <div
          className="pointer-events-none fixed z-50 rounded-[14px] border-2 border-accent shadow-[0_0_0_9999px_rgba(10,10,16,.30),0_18px_60px_rgba(20,20,25,.22)]"
          style={{
            height: targetRect.height + 16,
            left: targetRect.left - 8,
            top: targetRect.top - 8,
            width: targetRect.width + 16
          }}
        />
      ) : null}
      <div
        className={`fixed left-4 right-4 z-50 md:left-auto md:right-5 md:w-[410px] ${
          panelPosition === "bottom" ? "bottom-[88px] md:bottom-5" : "top-5"
        }`}
      >
      <section className="rounded-[14px] border border-[color-mix(in_oklab,var(--accent)_28%,var(--line))] bg-surface p-4 shadow-[0_24px_80px_rgba(10,10,16,.26)]">
        <div className="mb-3 flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-accent-muted text-accent-ink">
            <Compass className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="m-0 font-mono text-[10.5px] uppercase tracking-[.12em] text-faint">{step.eyebrow} · {progressLabel}</p>
              <button
                aria-label="Fermer la visite guidée"
                className="flex size-7 cursor-pointer items-center justify-center rounded-[8px] text-faint transition hover:bg-panel hover:text-foreground"
                onClick={finishTour}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>
            <h2 className="m-0 mt-1 text-[17px] font-semibold tracking-[0] text-foreground">{step.title}</h2>
            <p className="m-0 mt-2 text-[13px] leading-6 text-muted">{step.body}</p>
            <div className="mt-3 flex items-start gap-2 rounded-[10px] border border-line2 bg-background px-3 py-2">
              <MousePointer2 className="mt-0.5 size-4 shrink-0 text-accent-ink" />
              <p className="m-0 text-[12.5px] font-[550] leading-5 text-foreground">{step.instruction}</p>
            </div>
          </div>
        </div>

        <div className="mb-3 grid grid-cols-5 gap-1">
          {onboardingTourSteps.map((item, index) => (
            <span
              aria-label={item.title}
              className={`h-1.5 rounded-full ${index <= stepIndex ? "bg-accent" : "bg-line2"}`}
              key={item.id}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <button className="cursor-pointer text-[12.5px] font-[550] text-muted transition hover:text-foreground" onClick={finishTour} type="button">
            Passer la visite
          </button>
          <div className="flex flex-wrap gap-2">
            {stepIndex > 0 ? (
              <Button onClick={previousStep} size="sm" type="button" variant="quiet">
                Retour
              </Button>
            ) : null}
            <Link href={currentHref}>
              <Button leftIcon={<ArrowRight />} size="sm" type="button" variant="ghost">
                Aller à cet écran
              </Button>
            </Link>
            <Button leftIcon={isLastStep ? <Check /> : undefined} onClick={nextStep} size="sm" type="button" variant="primary">
              {isLastStep ? "Terminer" : "J'ai fait cette étape"}
            </Button>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}
