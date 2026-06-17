"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function LandingMotion() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      gsap.fromTo(
        "[data-landing-reveal]",
        { autoAlpha: 0, y: 22 },
        {
          autoAlpha: 1,
          duration: 0.72,
          ease: "power3.out",
          stagger: 0.08,
          y: 0
        }
      );

      gsap.utils.toArray<HTMLElement>("[data-scroll-reveal]").forEach((element) => {
        gsap.fromTo(
          element,
          { autoAlpha: 0, y: 26 },
          {
            autoAlpha: 1,
            duration: 0.72,
            ease: "power3.out",
            scrollTrigger: {
              end: "top 48%",
              once: true,
              start: "top 82%",
              trigger: element
            },
            y: 0
          }
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-progress-line]").forEach((element) => {
        gsap.fromTo(
          element,
          { scaleX: 0 },
          {
            duration: 0.9,
            ease: "power2.out",
            scaleX: 1,
            scrollTrigger: {
              once: true,
              start: "top 76%",
              trigger: element
            }
          }
        );
      });
    });

    return () => context.revert();
  }, []);

  return null;
}
