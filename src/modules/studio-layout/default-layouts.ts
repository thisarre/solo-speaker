import type { DashboardLayoutConfig, DashboardWidgetId, EditorLayoutConfig, EditorPanelConfig, EditorPanelId } from "./types";

const dashboardWidgetOrder: DashboardWidgetId[] = [
  "resume-talk",
  "preparation-summary",
  "status-distribution",
  "type-distribution",
  "quick-actions",
  "recent-talks"
];

export const defaultDashboardLayout: DashboardLayoutConfig = {
  updatedAt: "default",
  widgets: dashboardWidgetOrder.map((id, order) => ({
    id,
    order,
    visible: true,
    size: id === "resume-talk" || id === "recent-talks" ? "large" : "medium"
  }))
};

export const editorPanelOrder: EditorPanelId[] = [
  "app-sidebar",
  "section-rail",
  "talk-header",
  "metadata-bar",
  "assistant-panel",
  "status-bar",
  "export-actions",
  "speaking-actions",
  "editor-toolbar"
];

export function createEditorPanels(visibleIds: EditorPanelId[]): EditorPanelConfig[] {
  return editorPanelOrder.map((id, order) => ({
    id,
    order,
    visible: visibleIds.includes(id),
    position: id === "section-rail" || id === "app-sidebar" ? "left" : id === "assistant-panel" ? "right" : id === "talk-header" || id === "metadata-bar" ? "top" : "center"
  }));
}

export const defaultEditorLayout: EditorLayoutConfig = {
  preset: "complete",
  focusModeEnabled: false,
  updatedAt: "default",
  panels: createEditorPanels(editorPanelOrder)
};
