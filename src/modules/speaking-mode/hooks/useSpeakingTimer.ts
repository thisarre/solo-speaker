"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useSpeakingTimer(isPlaying: boolean) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);

  useEffect(() => {
    let animationFrame = 0;

    function tick(now: number) {
      if (lastTickRef.current === null) {
        lastTickRef.current = now;
      }

      if (isPlaying) {
        elapsedRef.current += (now - lastTickRef.current) / 1000;
        setElapsedSeconds(Math.floor(elapsedRef.current));
      }

      lastTickRef.current = now;
      animationFrame = requestAnimationFrame(tick);
    }

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying]);

  const reset = useCallback(() => {
    elapsedRef.current = 0;
    lastTickRef.current = null;
    setElapsedSeconds(0);
  }, []);

  return { elapsedSeconds, reset };
}
