"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useI18n } from "@/i18n/client";

export type AutosaveState = "idle" | "dirty" | "saving" | "saved" | "error";

const statusConfig = {
  idle: { icon: CheckCircle2, className: "text-faint" },
  dirty: { icon: AlertCircle, className: "text-faint" },
  saving: { icon: Loader2, className: "text-muted" },
  saved: { icon: CheckCircle2, className: "text-ok" },
  error: { icon: AlertCircle, className: "text-[var(--danger)]" }
} satisfies Record<AutosaveState, { icon: typeof CheckCircle2; className: string }>;

export function AutosaveStatus({ state }: { state: AutosaveState }) {
  const { messages } = useI18n();
  const config = statusConfig[state];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs ${config.className}`}>
      <Icon className={`size-3.5 ${state === "saving" ? "animate-spin" : ""}`} />
      {messages.editor.autosave[state]}
    </span>
  );
}
