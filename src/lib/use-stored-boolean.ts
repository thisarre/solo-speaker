"use client";

import { useCallback, useSyncExternalStore } from "react";

type BooleanStateAction = boolean | ((current: boolean) => boolean);

function getStoredBoolean(key: string, fallback: boolean) {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  return value === null ? fallback : value === "true";
}

// Booléen persisté en localStorage, synchronisé entre composants (event dédié)
// et entre onglets (event storage natif).
export function useStoredBoolean(key: string, fallback: boolean) {
  const value = useSyncExternalStore(
    (onStoreChange) => {
      const eventName = `solo-speaker-storage:${key}`;
      const handleStorage = (event: StorageEvent) => {
        if (event.key === key) onStoreChange();
      };

      window.addEventListener("storage", handleStorage);
      window.addEventListener(eventName, onStoreChange);

      return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener(eventName, onStoreChange);
      };
    },
    () => getStoredBoolean(key, fallback),
    () => fallback
  );

  const setValue = useCallback(
    (next: BooleanStateAction) => {
      const current = getStoredBoolean(key, fallback);
      const resolved = typeof next === "function" ? next(current) : next;
      window.localStorage.setItem(key, String(resolved));
      window.dispatchEvent(new Event(`solo-speaker-storage:${key}`));
    },
    [fallback, key]
  );

  return [value, setValue] as const;
}
