"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export type AutosaveState = "idle" | "dirty" | "saving" | "saved" | "error";

const statusConfig = {
  idle: { label: "À jour", icon: CheckCircle2, className: "text-faint" },
  dirty: { label: "Modifié", icon: AlertCircle, className: "text-faint" },
  saving: { label: "Sauvegarde...", icon: Loader2, className: "text-muted" },
  saved: { label: "Sauvegardé", icon: CheckCircle2, className: "text-ok" },
  error: { label: "Erreur de sauvegarde", icon: AlertCircle, className: "text-[var(--danger)]" }
} satisfies Record<AutosaveState, { label: string; icon: typeof CheckCircle2; className: string }>;

export function AutosaveStatus({ state }: { state: AutosaveState }) {
  const config = statusConfig[state];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs ${config.className}`}>
      <Icon className={`size-3.5 ${state === "saving" ? "animate-spin" : ""}`} />
      {config.label}
    </span>
  );
}
