"use client";

import posthog from "posthog-js";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/client";
import { AssistantActionButton } from "@/modules/assistant/components/assistant-action-button";
import { generateAssistantContent } from "@/modules/assistant/actions";
import { getEnabledAssistantFeatures } from "@/modules/assistant/feature-registry";
import { useAssistantFeatureSettings } from "@/modules/assistant/feature-settings";
import type {
  AssistantAction,
  AssistantGenerateResult,
  AssistantOutlineSection,
  AssistantSectionContext,
  AssistantTalkContext
} from "@/modules/assistant/types";
import type { TalkLanguage } from "@/types/talk";

type AssistantPanelProps = {
  activeSection?: AssistantSectionContext;
  className?: string;
  durationMinutes: number;
  language: TalkLanguage;
  onResult: (result: AssistantGenerateResult, action: AssistantAction) => void;
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
  const { messages } = useI18n();
  const copy = messages.assistant;
  const [objective, setObjective] = useState("");
  const [targetMinutes, setTargetMinutes] = useState(String(durationMinutes));
  const [loadingAction, setLoadingAction] = useState<AssistantAction | null>(null);
  const [error, setError] = useState("");
  const { settings } = useAssistantFeatureSettings();
  const enabledFeatures = getEnabledAssistantFeatures(type, settings);

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
          targetDurationMin: parsedDuration,
          language
        },
        section: action === "outline" ? undefined : activeSection
      });

      posthog.capture("ai_assistant_used", {
        action,
        talk_type: type,
        talk_language: language,
        has_section: Boolean(activeSection)
      });

      onResult(normalizeResult(result, copy.untitled), action);
    } catch (assistantError) {
      posthog.captureException(assistantError);
      setError(assistantError instanceof Error ? assistantError.message : copy.generationError);
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
          <h2 className="m-0 text-[15px] font-semibold tracking-[0] text-foreground">{copy.title}</h2>
          <p className="mt-1 text-[12.5px] leading-5 text-muted">{copy.panelDescription}</p>
        </div>
      </div>

      <div className="grid gap-3">
        <label className="grid gap-1.5 text-xs font-[550] text-muted">
          {copy.objective}
          <textarea
            className="studio-textarea min-h-20 resize-y rounded-[9px] border border-border bg-background px-3 py-2 text-foreground outline-none placeholder:text-faint focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_16%,transparent)]"
            onChange={(event) => setObjective(event.target.value)}
            placeholder={copy.objectivePlaceholder}
            value={objective}
          />
        </label>

        <label className="grid gap-1.5 text-xs font-[550] text-muted">
          {copy.targetDuration}
          <div className="flex h-9 items-center rounded-[8px] border border-border bg-background focus-within:border-accent focus-within:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_16%,transparent)]">
            <input
              aria-label={copy.targetDurationAria}
              className="studio-input min-w-0 flex-1 bg-transparent px-3 text-foreground outline-none"
              min={1}
              onChange={(event) => setTargetMinutes(event.target.value)}
              type="number"
              value={targetMinutes}
            />
            <span className="shrink-0 border-l border-line2 px-2.5 font-mono text-[10.5px] uppercase tracking-[.08em] text-faint">min</span>
          </div>
        </label>

        <div className="grid gap-2">
          {enabledFeatures.has("outline") ? <AssistantActionButton description={copy.outlineDescription} loading={loadingAction === "outline"} onClick={() => runAssistant("outline")}>
            {copy.outline}
          </AssistantActionButton> : null}
          {enabledFeatures.has("expand-section") ? <AssistantActionButton description={copy.expandDescription} disabled={isSectionActionDisabled} loading={loadingAction === "expand-section"} onClick={() => runAssistant("expand-section")}>
            {copy.expand}
          </AssistantActionButton> : null}
          {enabledFeatures.has("oralize-section") ? <AssistantActionButton description={copy.oralizeDescription} disabled={isSectionActionDisabled} loading={loadingAction === "oralize-section"} onClick={() => runAssistant("oralize-section")}>
            {copy.oralize}
          </AssistantActionButton> : null}
          {enabledFeatures.has("shorten-section") ? <AssistantActionButton description={copy.shortenDescription} disabled={isSectionActionDisabled} loading={loadingAction === "shorten-section"} onClick={() => runAssistant("shorten-section")}>
            {copy.shorten}
          </AssistantActionButton> : null}
          {enabledFeatures.has("suggest-bible") ? <AssistantActionButton description={copy.suggestBibleDescription} disabled={isSectionActionDisabled} loading={loadingAction === "suggest-bible"} onClick={() => runAssistant("suggest-bible")}>
            {copy.suggestBible}
          </AssistantActionButton> : null}
        </div>

        {activeSection ? (
          <p className="m-0 break-words font-mono text-[10.5px] text-faint">{copy.activeSection.replace("{title}", activeSection.heading || copy.untitled)}</p>
        ) : (
          <p className="m-0 text-[12px] leading-5 text-muted">{copy.noSection}</p>
        )}
        {error ? <Alert>{error}</Alert> : null}
      </div>
    </aside>
  );
}

function normalizeResult(result: AssistantGenerateResult, untitled: string): AssistantGenerateResult {
  if (result.kind !== "outline") {
    return result;
  }

  return {
    kind: "outline",
    sections: result.sections.map((section) => cleanSection(section, untitled)).filter((section) => section.heading || section.body)
  };
}

function cleanSection(section: AssistantOutlineSection, untitled: string): AssistantOutlineSection {
  return {
    heading: section.heading.trim() || untitled,
    body: section.body.trim()
  };
}
