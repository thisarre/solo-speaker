"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ChevronDown, Highlighter, Mic2, Play, Timer } from "lucide-react";
import { useI18n } from "@/i18n/client";

const ACTIVE_COLOR = "#f3f3f7";
const DIM_COLOR = "rgba(236,236,241,.26)";
const HIGHLIGHT_BG = "rgba(123,121,255,.34)";
const STEP_ICONS = [Mic2, Highlighter, ChevronDown];

export function ProductPreview() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { messages } = useI18n();
  const scriptLines = messages.landing.previewScriptLines;
  const steps = messages.landing.previewSteps;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const screen = root.querySelector<HTMLElement>("[data-preview-screen]");
    const track = root.querySelector<HTMLElement>("[data-preview-track]");
    const lineEls = Array.from(root.querySelectorAll<HTMLElement>("[data-line]"));
    const stepEls = Array.from(root.querySelectorAll<HTMLElement>("[data-step]"));
    if (!screen || !track || !lineEls.length) return;

    // Measure where each line sits so the active one lands on the reading line, whatever the
    // responsive font size — the scroll keeps the spoken line at the reading marker.
    const readingY = screen.clientHeight * 0.47;
    const targetY = lineEls.map((el) => readingY - (el.offsetTop + el.offsetHeight / 2));

    const setStep = (active: number) =>
      stepEls.forEach((el, index) => {
        const on = index === active;
        el.classList.toggle("border-accent", on);
        el.classList.toggle("bg-accent-muted", on);
        el.classList.toggle("text-accent-ink", on);
        el.classList.toggle("border-line", !on);
        el.classList.toggle("text-muted", !on);
      });

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      gsap.set(track, { y: targetY[0] });
      gsap.set(lineEls[0], { color: ACTIVE_COLOR });
      gsap.set(lineEls[0].querySelectorAll("[data-word]"), { backgroundColor: HIGHLIGHT_BG, color: "#ffffff" });
      setStep(1);
      return;
    }

    const context = gsap.context(() => {
      gsap.set(track, { y: targetY[0] });
      gsap.set(lineEls[0], { color: ACTIVE_COLOR });
      setStep(0);

      gsap.to("[data-wave]", {
        duration: () => gsap.utils.random(0.34, 0.74),
        ease: "sine.inOut",
        repeat: -1,
        scaleY: () => gsap.utils.random(0.42, 1.18),
        stagger: 0.05,
        yoyo: true
      });

      const timeline = gsap.timeline({ repeat: -1, repeatDelay: 0.7 });

      lineEls.forEach((lineEl, index) => {
        const words = lineEl.querySelectorAll("[data-word]");
        const isLast = index === lineEls.length - 1;

        // 1) You speak → 2) the words you just said lock on, swept left to right.
        timeline.add(() => setStep(0));
        timeline.to(words, { backgroundColor: HIGHLIGHT_BG, color: "#ffffff", duration: 0.12, ease: "none", stagger: 0.18 });
        timeline.add(() => setStep(1), "+=0.1");

        // 3) The screen follows: bring the next line to the reading marker.
        timeline.add(() => setStep(2), "+=0.35");
        if (!isLast) {
          timeline.to(track, { y: targetY[index + 1], duration: 0.65, ease: "power2.inOut" });
          timeline.to(lineEls[index + 1], { color: ACTIVE_COLOR, duration: 0.4 }, "<");
          timeline.to(lineEl, { color: DIM_COLOR, duration: 0.4 }, "<");
          timeline.add(() => gsap.set(words, { clearProps: "backgroundColor,color" }));
        } else {
          timeline.to({}, { duration: 0.7 });
          timeline.to(track, { y: targetY[0], duration: 0.55, ease: "power2.inOut" });
          timeline.to(lineEl, { color: DIM_COLOR, duration: 0.4 }, "<");
          timeline.to(lineEls[0], { color: ACTIVE_COLOR, duration: 0.4 }, "<");
          timeline.add(() => lineEls.forEach((el) => gsap.set(el.querySelectorAll("[data-word]"), { clearProps: "backgroundColor,color" })));
        }
      });
    }, rootRef);

    return () => context.revert();
  }, [scriptLines, steps]);

  return (
    <div
      className="rounded-[8px] border border-line bg-surface p-2 shadow-[0_18px_60px_rgba(20,20,25,.10)] dark:shadow-[0_22px_70px_rgba(0,0,0,.35)]"
      ref={rootRef}
    >
      <div className="grid min-h-[470px] overflow-hidden rounded-[6px] border border-line bg-panel md:grid-cols-[150px_minmax(0,1fr)]">
        <aside className="hidden border-r border-line bg-background/70 p-3 md:block">
          <div className="mb-4 font-mono text-[10px] uppercase tracking-[.12em] text-faint">{messages.landing.previewPlan}</div>
          {messages.landing.previewPlanItems.map((item, index) => (
            <div
              className={`mb-2 rounded-[6px] border px-2.5 py-2 text-[12px] ${
                index === 1 ? "border-accent bg-accent-muted font-semibold text-accent-ink" : "border-line bg-surface text-muted"
              }`}
              key={item}
            >
              <span className="mr-2 font-mono text-[10px] text-faint">{index + 1}</span>
              {item}
            </div>
          ))}
        </aside>

        <div className="flex min-w-0 flex-col">
          <div className="flex h-11 items-center justify-between border-b border-line px-4 font-mono text-[10px] uppercase tracking-[.12em] text-faint">
            <span>{messages.speakingMode.title}</span>
            <span>{messages.speakingMode.voiceFollow}</span>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden bg-[#111217] px-5 py-10 text-[#ececf1] md:px-8" data-preview-screen>
            <div className="absolute left-5 right-5 top-[47%] h-px bg-[#ececf1]/40 md:left-8 md:right-8" aria-hidden="true" />
            <div className="will-change-transform" data-preview-track>
              <div className="space-y-6">
                {scriptLines.map((line) => (
                  <p
                    className="m-0 text-[29px] font-semibold leading-[1.12] tracking-[0] text-[#ececf1]/25 md:text-[40px]"
                    data-line
                    key={line}
                  >
                    {line.split(" ").map((word, wordIndex) => (
                      <span className="rounded-[5px]" data-word key={`${word}-${wordIndex}`}>
                        {wordIndex > 0 ? ` ${word}` : word}
                      </span>
                    ))}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-line bg-surface px-4 py-3">
            <div className="flex items-center justify-between gap-3 text-muted">
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <Timer className="size-4" />
                08:42
              </div>
              <div className="flex items-end gap-1.5" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((item) => (
                  <span className="h-5 w-1 origin-bottom rounded-full bg-accent" data-wave key={item} />
                ))}
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <Mic2 className="size-4" />
                {messages.speakingMode.live}
              </div>
              <Play className="size-4 text-faint" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {steps.map((label, index) => {
          const Icon = STEP_ICONS[index] ?? Mic2;
          return (
            <div
              className="flex items-center gap-2 rounded-[8px] border border-line px-2.5 py-2 text-[12px] text-muted transition-colors"
              data-step
              key={label}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
