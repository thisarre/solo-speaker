import { createEditorPanels } from "./default-layouts";
import type { EditorLayoutConfig, EditorLayoutPreset, EditorPanelId } from "./types";

type EditorPresetDefinition = {
  label: string;
  description: string;
  visiblePanels: EditorPanelId[];
};

export const editorLayoutPresets: Record<EditorLayoutPreset, EditorPresetDefinition> = {
  complete: {
    label: "Complet",
    description: "Édition, plan, IA, export et présentation.",
    visiblePanels: ["app-sidebar", "section-rail", "talk-header", "metadata-bar", "assistant-panel", "status-bar", "export-actions", "speaking-actions", "editor-toolbar"]
  },
  focus: {
    label: "Concentration",
    description: "Écriture centrée avec le minimum nécessaire.",
    visiblePanels: ["talk-header", "status-bar", "speaking-actions", "editor-toolbar"]
  },
  ai: {
    label: "IA",
    description: "Plan, contenu et assistant mis en avant.",
    visiblePanels: ["app-sidebar", "section-rail", "talk-header", "assistant-panel", "status-bar", "editor-toolbar"]
  },
  rehearsal: {
    label: "Répétition",
    description: "Structure, durée et passage vers Speaking Mode.",
    visiblePanels: ["app-sidebar", "section-rail", "talk-header", "metadata-bar", "status-bar", "export-actions", "speaking-actions"]
  },
  minimal: {
    label: "Minimal",
    description: "Lecture et correction presque sans panneaux.",
    visiblePanels: ["talk-header", "status-bar"]
  }
};

export function createEditorLayoutFromPreset(preset: EditorLayoutPreset, focusModeEnabled = preset === "focus"): EditorLayoutConfig {
  return {
    preset,
    focusModeEnabled,
    updatedAt: new Date().toISOString(),
    panels: createEditorPanels(editorLayoutPresets[preset].visiblePanels)
  };
}

export function isEditorPanelVisible(layout: EditorLayoutConfig, panelId: EditorPanelId) {
  return layout.panels.find((panel) => panel.id === panelId)?.visible ?? false;
}
