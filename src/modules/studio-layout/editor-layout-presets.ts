import { createEditorPanels } from "./default-layouts";
import type { EditorLayoutConfig, EditorLayoutPreset, EditorPanelId } from "./types";
import { getMessages } from "@/i18n/messages";
import { defaultLocale, type Locale } from "@/i18n/routing";

type EditorPresetDefinition = {
  label: string;
  description: string;
  visiblePanels: EditorPanelId[];
};

const presetPanels: Record<EditorLayoutPreset, EditorPanelId[]> = {
  complete: ["app-sidebar", "section-rail", "talk-header", "metadata-bar", "assistant-panel", "status-bar", "export-actions", "speaking-actions", "editor-toolbar"],
  focus: ["talk-header", "status-bar", "speaking-actions", "editor-toolbar"],
  ai: ["app-sidebar", "section-rail", "talk-header", "assistant-panel", "status-bar", "editor-toolbar"],
  rehearsal: ["app-sidebar", "section-rail", "talk-header", "metadata-bar", "status-bar", "export-actions", "speaking-actions"],
  minimal: ["talk-header", "status-bar"]
};

export function getEditorLayoutPresets(locale: Locale = defaultLocale): Record<EditorLayoutPreset, EditorPresetDefinition> {
  const copy = getMessages(locale).settings.editorLayoutPresets;

  return {
  complete: {
      label: copy.complete[0],
      description: copy.complete[1],
      visiblePanels: presetPanels.complete
  },
  focus: {
      label: copy.focus[0],
      description: copy.focus[1],
      visiblePanels: presetPanels.focus
  },
  ai: {
      label: copy.ai[0],
      description: copy.ai[1],
      visiblePanels: presetPanels.ai
  },
  rehearsal: {
      label: copy.rehearsal[0],
      description: copy.rehearsal[1],
      visiblePanels: presetPanels.rehearsal
  },
  minimal: {
      label: copy.minimal[0],
      description: copy.minimal[1],
      visiblePanels: presetPanels.minimal
    }
  };
}

export const editorLayoutPresets: Record<EditorLayoutPreset, EditorPresetDefinition> = getEditorLayoutPresets(defaultLocale);

export function createEditorLayoutFromPreset(preset: EditorLayoutPreset, focusModeEnabled = preset === "focus"): EditorLayoutConfig {
  return {
    preset,
    focusModeEnabled,
    updatedAt: new Date().toISOString(),
    panels: createEditorPanels(presetPanels[preset])
  };
}

export function isEditorPanelVisible(layout: EditorLayoutConfig, panelId: EditorPanelId) {
  return layout.panels.find((panel) => panel.id === panelId)?.visible ?? false;
}
