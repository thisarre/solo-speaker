"use client";

import { useCallback, useSyncExternalStore } from "react";
import { defaultDashboardLayout, defaultEditorLayout } from "./default-layouts";
import { createEditorLayoutFromPreset } from "./editor-layout-presets";
import type { DashboardLayoutConfig, DashboardWidgetConfig, EditorLayoutConfig, EditorLayoutPreset } from "./types";

export const dashboardLayoutStorageKey = "solo-speaker.dashboard-layout.v1";
export const editorLayoutStorageKey = "solo-speaker.editor-layout.v1";
export const editorFocusModeStorageKey = "solo-speaker.editor-focus-mode.v1";

let dashboardSnapshotCache: { raw: string | null; value: DashboardLayoutConfig } = {
  raw: null,
  value: defaultDashboardLayout
};
let editorSnapshotCache: { raw: string | null; focusRaw: string | null; value: EditorLayoutConfig } = {
  raw: null,
  focusRaw: null,
  value: defaultEditorLayout
};

function now() {
  return new Date().toISOString();
}

function safeRead(key: string) {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: string) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, value);
    window.dispatchEvent(new Event(`solo-speaker-storage:${key}`));
  } catch {
    // Preferences are local enhancements only.
  }
}

function subscribeToKey(key: string, onStoreChange: () => void) {
  const customEvent = `solo-speaker-storage:${key}`;
  const handleStorage = (event: StorageEvent) => {
    if (event.key === key) onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(customEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(customEvent, onStoreChange);
  };
}

function normalizeDashboardLayout(input: DashboardLayoutConfig): DashboardLayoutConfig {
  const byId = new Map(input.widgets.map((widget) => [widget.id, widget]));
  const widgets = defaultDashboardLayout.widgets.map((fallbackWidget) => {
    const saved = byId.get(fallbackWidget.id);
    return saved ? { ...fallbackWidget, ...saved } : fallbackWidget;
  });

  return {
    updatedAt: input.updatedAt || now(),
    widgets: widgets.sort((a, b) => a.order - b.order).map((widget, order) => ({ ...widget, order }))
  };
}

function getDashboardSnapshot() {
  const stored = safeRead(dashboardLayoutStorageKey);
  if (stored === dashboardSnapshotCache.raw) return dashboardSnapshotCache.value;

  if (!stored) {
    dashboardSnapshotCache = { raw: stored, value: defaultDashboardLayout };
    return dashboardSnapshotCache.value;
  }

  try {
    dashboardSnapshotCache = {
      raw: stored,
      value: normalizeDashboardLayout(JSON.parse(stored) as DashboardLayoutConfig)
    };
    return dashboardSnapshotCache.value;
  } catch {
    dashboardSnapshotCache = { raw: stored, value: defaultDashboardLayout };
    return dashboardSnapshotCache.value;
  }
}

function getEditorSnapshot() {
  const stored = safeRead(editorLayoutStorageKey);
  const focusStored = safeRead(editorFocusModeStorageKey);
  if (stored === editorSnapshotCache.raw && focusStored === editorSnapshotCache.focusRaw) {
    return editorSnapshotCache.value;
  }

  try {
    const parsed = stored ? (JSON.parse(stored) as EditorLayoutConfig) : defaultEditorLayout;
    editorSnapshotCache = {
      raw: stored,
      focusRaw: focusStored,
      value: {
        ...parsed,
        focusModeEnabled: focusStored === null ? parsed.focusModeEnabled : focusStored === "true"
      }
    };
    return editorSnapshotCache.value;
  } catch {
    editorSnapshotCache = { raw: stored, focusRaw: focusStored, value: defaultEditorLayout };
    return editorSnapshotCache.value;
  }
}

export function saveDashboardLayout(layout: DashboardLayoutConfig) {
  safeWrite(dashboardLayoutStorageKey, JSON.stringify(normalizeDashboardLayout({ ...layout, updatedAt: now() })));
}

export function resetDashboardLayout() {
  saveDashboardLayout({ ...defaultDashboardLayout, updatedAt: now() });
}

export function saveEditorLayout(layout: EditorLayoutConfig) {
  safeWrite(editorLayoutStorageKey, JSON.stringify({ ...layout, updatedAt: now() }));
  safeWrite(editorFocusModeStorageKey, String(layout.focusModeEnabled));
}

export function resetEditorLayout() {
  saveEditorLayout({ ...defaultEditorLayout, updatedAt: now() });
}

export function useDashboardLayout() {
  const layout = useSyncExternalStore(
    (onStoreChange) => subscribeToKey(dashboardLayoutStorageKey, onStoreChange),
    getDashboardSnapshot,
    () => defaultDashboardLayout
  );

  const updateWidgets = useCallback((widgets: DashboardWidgetConfig[]) => {
    saveDashboardLayout({ widgets, updatedAt: now() });
  }, []);

  const reset = useCallback(() => resetDashboardLayout(), []);

  return { layout, reset, updateWidgets };
}

export function useEditorLayout() {
  const layout = useSyncExternalStore(
    (onStoreChange) => {
      const unsubscribeLayout = subscribeToKey(editorLayoutStorageKey, onStoreChange);
      const unsubscribeFocus = subscribeToKey(editorFocusModeStorageKey, onStoreChange);
      return () => {
        unsubscribeLayout();
        unsubscribeFocus();
      };
    },
    getEditorSnapshot,
    () => defaultEditorLayout
  );

  const setPreset = useCallback((preset: EditorLayoutPreset) => {
    saveEditorLayout(createEditorLayoutFromPreset(preset));
  }, []);

  const setFocusMode = useCallback(
    (enabled: boolean) => {
      const next = enabled ? createEditorLayoutFromPreset("focus", true) : createEditorLayoutFromPreset(layout.preset === "focus" ? "complete" : layout.preset, false);
      saveEditorLayout(next);
    },
    [layout.preset]
  );

  const reset = useCallback(() => resetEditorLayout(), []);

  return { layout, reset, setFocusMode, setPreset };
}
