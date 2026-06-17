export type DashboardWidgetId =
  | "resume-talk"
  | "recent-talks"
  | "quick-actions"
  | "preparation-summary"
  | "status-distribution"
  | "type-distribution";

export type DashboardWidgetConfig = {
  id: DashboardWidgetId;
  visible: boolean;
  order: number;
  size?: "small" | "medium" | "large";
};

export type DashboardLayoutConfig = {
  widgets: DashboardWidgetConfig[];
  updatedAt: string;
};

export type EditorLayoutPreset = "complete" | "focus" | "ai" | "rehearsal" | "minimal";

export type EditorPanelId =
  | "app-sidebar"
  | "section-rail"
  | "talk-header"
  | "metadata-bar"
  | "assistant-panel"
  | "status-bar"
  | "export-actions"
  | "speaking-actions"
  | "editor-toolbar";

export type EditorPanelConfig = {
  id: EditorPanelId;
  visible: boolean;
  position?: "left" | "right" | "top" | "center";
  order?: number;
};

export type EditorLayoutConfig = {
  preset: EditorLayoutPreset;
  panels: EditorPanelConfig[];
  focusModeEnabled: boolean;
  updatedAt: string;
};
