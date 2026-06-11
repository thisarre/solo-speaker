"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/lib/utils";
import { AssistantActionButton } from "@/modules/assistant/components/assistant-action-button";
import { generateAssistantContent } from "@/modules/assistant/actions";
import type {
  AssistantAction,
  AssistantGenerateResult,
  AssistantOutlineSection,
  AssistantSectionContext,
  AssistantTalkContext
} from "@/modules/assistant/types";

type AssistantPanelProps = {
  activeSection?: AssistantSectionContext;
  className?: string;
  durationMinutes: number;
  language: "FR" | "EN";
  onResult: (result: AssistantGenerateResult) => void;
  talkId: string;
  title: string;
  type: AssistantTalkContext["type"];
  audience: string;
};

export function AssistantPanel({
  activeSection,
  audience,
  className,
  durationMinutes,
  language,
  onResult,
  talkId,
  title,
  type
}: AssistantPanelProps) {
  const [objective, setObjective] = useState("");
  const [targetMinutes, setTargetMinutes] = useState(String(durationMinutes));
  const [loadingAction, setLoadingAction] = useState<AssistantAction | null>(null);
  const [error, setError] = useState("");

  const parsedDuration = Math.max(1, Math.round(Number(targetMinutes) || durationMinutes || 10));
  const isSectionActionDisabled = !activeSection || loadingAction !== null;

  async function runAssistant(action: AssistantAction) {
    setError("");
    setLoadingAction(action);

    try {
      const result = await generateAssistantContent({
        action,
        talkId,
        talk: {
          title,
          type,
          audience,
          objective,
          durationMinutes: parsedDuration,
          language
        },
        section: action === "outline" ? undefined : activeSection
      });

      onResult(normalizeResult(result));
    } catch (assistantError) {
      setError(assistantError instanceof Error ? assistantError.message : "Génération IA impossible.");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <aside className={cn("rounded-[12px] border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(20,20,25,.03)]", className)}>
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-accent-muted text-accent-ink">
          <Sparkles className="size-4" />
        </div>
        <div className="min-w-0">
          <h2 className="m-0 text-[15px] font-semibold tracking-[0] text-foreground">Assistant IA</h2>
          <p className="mt-1 text-[12.5px] leading-5 text-muted">Génère une proposition, puis valide l&apos;insertion.</p>
        </div>
      </div>

      <div className="grid gap-3">
        <label className="grid gap-1.5 text-xs font-[550] text-muted">
          Objectif
          <textarea
            className="studio-textarea min-h-20 resize-y rounded-[9px] border border-border bg-background px-3 py-2 text-foreground outline-none placeholder:text-faint focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_16%,transparent)]"
            onChange={(event) => setObjective(event.target.value)}
            placeholder={"Ce que l'audience doit comprendre, ressentir ou faire."}
            value={objective}
          />
        </label>

        <label className="grid gap-1.5 text-xs font-[550] text-muted">
          Durée cible
          <input
            className="studio-input h-9 rounded-[8px] border border-border bg-background px-3 text-foreground outline-none focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_16%,transparent)]"
            min={1}
            onChange={(event) => setTargetMinutes(event.target.value)}
            type="number"
            value={targetMinutes}
          />
        </label>

        <div className="grid gap-2">
          <AssistantActionButton loading={loadingAction === "outline"} onClick={() => runAssistant("outline")}>
            Générer un plan
          </AssistantActionButton>
          <AssistantActionButton disabled={isSectionActionDisabled} loading={loadingAction === "expand-section"} onClick={() => runAssistant("expand-section")}>
            Développer la section
          </AssistantActionButton>
          <AssistantActionButton disabled={isSectionActionDisabled} loading={loadingAction === "oralize-section"} onClick={() => runAssistant("oralize-section")}>
            Rendre plus oral
          </AssistantActionButton>
          <AssistantActionButton disabled={isSectionActionDisabled} loading={loadingAction === "shorten-section"} onClick={() => runAssistant("shorten-section")}>
            Raccourcir
          </AssistantActionButton>
        </div>

        {activeSection ? (
          <p className="m-0 truncate font-mono text-[10.5px] text-faint">Section active: {activeSection.heading || "Sans titre"}</p>
        ) : (
          <p className="m-0 text-[12px] leading-5 text-muted">Sélectionne une section pour utiliser les actions ciblées.</p>
        )}
        {error ? <Alert>{error}</Alert> : null}
      </div>
    </aside>
  );
}

function normalizeResult(result: AssistantGenerateResult): AssistantGenerateResult {
  if (result.kind !== "outline") {
    return result;
  }

  return {
    kind: "outline",
    sections: result.sections.map(cleanSection).filter((section) => section.heading || section.body)
  };
}

function cleanSection(section: AssistantOutlineSection): AssistantOutlineSection {
  return {
    heading: section.heading.trim() || "Sans titre",
    body: section.body.trim()
  };
}
