"use client";

import { FileText, Mic2, Sparkles, TimerReset, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

type AssistantPlaceholderPanelProps = {
  activeSectionTitle?: string;
  className?: string;
};

const actions = [
  { label: "Générer un plan", icon: FileText },
  { label: "Développer cette section", icon: Wand2 },
  { label: "Rendre plus oral", icon: Mic2 },
  { label: "Raccourcir", icon: TimerReset }
];

export function AssistantPlaceholderPanel({ activeSectionTitle, className }: AssistantPlaceholderPanelProps) {
  return (
    <aside className={cn("rounded-[12px] border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(20,20,25,.03)]", className)}>
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-accent-muted text-accent-ink">
          <Sparkles className="size-4" />
        </div>
        <div className="min-w-0">
          <h2 className="m-0 text-[15px] font-semibold tracking-[0] text-foreground">Assistant IA</h2>
          <p className="mt-1 text-[12.5px] leading-5 text-muted">Espace prêt pour les actions de préparation orale.</p>
        </div>
      </div>

      <div className="grid gap-2">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              className="studio-button-sm flex h-9 w-full items-center justify-between rounded-[8px] border border-border bg-background px-3 font-[550] text-muted transition disabled:cursor-not-allowed disabled:opacity-70"
              disabled
              key={action.label}
              type="button"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Icon className="size-3.5 shrink-0 text-faint" />
                <span className="truncate">{action.label}</span>
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[.08em] text-faint">Bientôt</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-[9px] border border-line2 bg-panel px-3 py-2">
        <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">Section active</p>
        <p className="m-0 mt-1 truncate text-[12.5px] font-[550] text-muted">{activeSectionTitle || "Aucune section sélectionnée"}</p>
      </div>
    </aside>
  );
}
