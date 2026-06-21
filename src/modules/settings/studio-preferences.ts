import type { VoiceFollowProviderMode } from "@/modules/speaking-mode/voice/types";

export const aiEnabledStorageKey = "solo-speaker.ai-enabled";
export const predictiveWritingStorageKey = "solo-speaker.predictive-writing";
export const prompterThemeStorageKey = "solo-speaker.prompter.default-theme";
export const prompterSpeedStorageKey = "solo-speaker.prompter.default-speed";
export const prompterFontSizeStorageKey = "solo-speaker.prompter.default-font-size";
export const voiceProviderStorageKey = "solo-speaker.prompter.voice-provider";

export type PrompterThemePreference = "dark" | "light";

export const defaultPrompterTheme: PrompterThemePreference = "dark";
export const defaultPrompterSpeed = 1;
export const defaultPrompterFontSize = 40;
export const defaultVoiceProvider: VoiceFollowProviderMode = "auto";

export const prompterSpeedOptions = [0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4] as const;
export const prompterFontSizeOptions = [32, 40, 48, 56] as const;
export const prompterThemeOptions = ["dark", "light"] as const;
export const voiceProviderOptions: VoiceFollowProviderMode[] = ["auto", "browser", "realtime"];

export function resolvePredictiveWritingPreference(
  current: { aiEnabled: boolean; predictiveWritingEnabled: boolean },
  nextPredictiveWritingEnabled: boolean
) {
  return {
    aiEnabled: nextPredictiveWritingEnabled ? true : current.aiEnabled,
    predictiveWritingEnabled: nextPredictiveWritingEnabled
  };
}

function readStoredValue(key: string) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

export function writeStudioPreference(key: string, value: string) {
  window.localStorage.setItem(key, value);
  window.dispatchEvent(new Event(`solo-speaker-storage:${key}`));
}

export function readStoredBoolean(key: string, fallback: boolean) {
  const value = readStoredValue(key);
  return value === null ? fallback : value === "true";
}

export function readPrompterThemePreference(): PrompterThemePreference {
  const value = readStoredValue(prompterThemeStorageKey);
  return value === "light" || value === "dark" ? value : defaultPrompterTheme;
}

export function readPrompterSpeedPreference() {
  const value = Number(readStoredValue(prompterSpeedStorageKey));
  return prompterSpeedOptions.includes(value as (typeof prompterSpeedOptions)[number]) ? value : defaultPrompterSpeed;
}

export function readPrompterFontSizePreference() {
  const value = Number(readStoredValue(prompterFontSizeStorageKey));
  return prompterFontSizeOptions.includes(value as (typeof prompterFontSizeOptions)[number]) ? value : defaultPrompterFontSize;
}

export function readVoiceProviderPreference(): VoiceFollowProviderMode {
  const value = readStoredValue(voiceProviderStorageKey);
  return value === "browser" || value === "realtime" || value === "auto" ? value : defaultVoiceProvider;
}
