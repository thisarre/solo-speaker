"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  defaultAssistantFeatureSettings,
  isAssistantFeature,
  type AssistantFeatureSettings
} from "@/modules/assistant/feature-registry";
import type { AssistantFeature } from "@/modules/assistant/types";

const assistantFeatureSettingsKey = "solo-speaker.assistant-feature-settings";
const assistantFeatureSettingsEvent = "solo-speaker-storage:assistant-feature-settings";
let cachedRawSettings: string | null = null;
let cachedSettings: AssistantFeatureSettings = defaultAssistantFeatureSettings;

function uniqueFeatures(features: AssistantFeature[]) {
  return Array.from(new Set(features.filter(isAssistantFeature)));
}

export function readAssistantFeatureSettings(): AssistantFeatureSettings {
  if (typeof window === "undefined") return defaultAssistantFeatureSettings;

  try {
    const raw = window.localStorage.getItem(assistantFeatureSettingsKey);
    if (raw === cachedRawSettings) return cachedSettings;

    const parsed = JSON.parse(raw ?? "null") as Partial<AssistantFeatureSettings> | null;
    cachedRawSettings = raw;
    cachedSettings = {
      extraEnabledFeatures: uniqueFeatures(parsed?.extraEnabledFeatures ?? [])
    };
    return cachedSettings;
  } catch {
    return defaultAssistantFeatureSettings;
  }
}

function writeAssistantFeatureSettings(settings: AssistantFeatureSettings) {
  window.localStorage.setItem(
    assistantFeatureSettingsKey,
    JSON.stringify({
      extraEnabledFeatures: uniqueFeatures(settings.extraEnabledFeatures)
    })
  );
  window.dispatchEvent(new Event(assistantFeatureSettingsEvent));
}

export function applyAssistantFeatureSettingsDefaults(defaults: AssistantFeatureSettings) {
  if (typeof window === "undefined") return;

  const current = readAssistantFeatureSettings();
  const merged = uniqueFeatures([...current.extraEnabledFeatures, ...defaults.extraEnabledFeatures]);

  if (merged.length === current.extraEnabledFeatures.length) return;

  writeAssistantFeatureSettings({
    extraEnabledFeatures: merged
  });
}

export function useAssistantFeatureSettings() {
  const settings = useSyncExternalStore(
    (onStoreChange) => {
      const handleStorage = (event: StorageEvent) => {
        if (event.key === assistantFeatureSettingsKey) onStoreChange();
      };

      window.addEventListener("storage", handleStorage);
      window.addEventListener(assistantFeatureSettingsEvent, onStoreChange);

      return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener(assistantFeatureSettingsEvent, onStoreChange);
      };
    },
    readAssistantFeatureSettings,
    () => defaultAssistantFeatureSettings
  );

  const setFeatureEnabled = useCallback((featureId: AssistantFeature, enabled: boolean) => {
    const current = readAssistantFeatureSettings();
    const extraEnabled = new Set(current.extraEnabledFeatures);

    if (enabled) {
      extraEnabled.add(featureId);
    } else {
      extraEnabled.delete(featureId);
    }

    writeAssistantFeatureSettings({
      extraEnabledFeatures: uniqueFeatures(Array.from(extraEnabled))
    });
  }, []);

  return { settings, setFeatureEnabled };
}
