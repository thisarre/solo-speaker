"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Mic2, Play, Timer } from "lucide-react";

const scriptLines = [
  "On commence par une image simple.",
  "Puis on donne le point de bascule.",
  "La phrase active reste nette.",
  "La suite apparaît avant la rupture.",
  "La conclusion garde sa place."
];

export function ProductPreview() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const context = gsap.context(() => {
      const timeline = gsap.timeline({ repeat: -1, repeatDelay: 0.8 });
      timeline
        .fromTo("[data-preview-card]", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, duration: 0.6, ease: "power3.out", y: 0 })
        .fromTo("[data-plan-item]", { autoAlpha: 0, x: -10 }, { autoAlpha: 1, duration: 0.36, ease: "power2.out", stagger: 0.08, x: 0 }, "-=0.22")
        .to("[data-preview-track]", { duration: 3.2, ease: "sine.inOut", y: -64 }, "+=0.3")
        .to("[data-preview-progress]", { duration: 3.2, ease: "none", scaleX: 1 }, "<")
        .to("[data-reading-line]", { duration: 1.2, ease: "sine.inOut", opacity: 0.92, scaleX: 1.08, yoyo: true, repeat: 1 }, "-=2.5")
        .to("[data-preview-track]", { duration: 0.8, ease: "power2.inOut", y: 0 }, "+=0.4")
        .to("[data-preview-progress]", { duration: 0.8, ease: "power2.inOut", scaleX: 0.18 }, "<");

      gsap.to("[data-wave]", {
        duration: () => gsap.utils.random(0.34, 0.74),
        ease: "sine.inOut",
        repeat: -1,
        scaleY: () => gsap.utils.random(0.42, 1.18),
        stagger: 0.05,
        yoyo: true
      });
    }, rootRef);

    return () => context.revert();
  }, []);

  return (
    <div
      className="rounded-[8px] border border-line bg-surface p-2 shadow-[0_18px_60px_rgba(20,20,25,.10)] dark:shadow-[0_22px_70px_rgba(0,0,0,.35)]"
      data-preview-card
      ref={rootRef}
    >
      <div className="grid min-h-[470px] overflow-hidden rounded-[6px] border border-line bg-panel md:grid-cols-[150px_minmax(0,1fr)]">
        <aside className="hidden border-r border-line bg-background/70 p-3 md:block">
          <div className="mb-4 font-mono text-[10px] uppercase tracking-[.12em] text-faint">Plan</div>
          {["Ouverture", "Idée", "Preuve", "Appel"].map((item, index) => (
            <div
              className={`mb-2 rounded-[6px] border px-2.5 py-2 text-[12px] ${
                index === 1 ? "border-accent bg-accent-muted font-semibold text-accent-ink" : "border-line bg-surface text-muted"
              }`}
              data-plan-item
              key={item}
            >
              <span className="mr-2 font-mono text-[10px] text-faint">{index + 1}</span>
              {item}
            </div>
          ))}
        </aside>

        <div className="flex min-w-0 flex-col">
          <div className="flex h-11 items-center justify-between border-b border-line px-4 font-mono text-[10px] uppercase tracking-[.12em] text-faint">
            <span>Speaking Mode</span>
            <span>Voice follow</span>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden bg-[#111217] px-5 py-10 text-[#ececf1] md:px-8">
            <div className="absolute left-5 right-5 top-[47%] h-px origin-left bg-[#ececf1]/70 md:left-8 md:right-8" data-reading-line />
            <div className="space-y-6 will-change-transform" data-preview-track>
              {scriptLines.map((line, index) => (
                <p
                  className={`m-0 text-[29px] leading-[1.08] tracking-[0] md:text-[40px] ${
                    index === 2 ? "font-bold text-[#ececf1]" : "font-semibold text-[#ececf1]/32"
                  }`}
                  key={line}
                >
                  {line}
                </p>
              ))}
            </div>
          </div>

          <div className="border-t border-line bg-surface px-4 py-3">
            <div className="mb-3 h-1 overflow-hidden rounded-full bg-line">
              <div className="h-full origin-left rounded-full bg-accent" data-preview-progress style={{ transform: "scaleX(.18)" }} />
            </div>
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
                live
              </div>
              <Play className="size-4 text-faint" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
