"use client";

import posthog from "posthog-js";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bold,
  BookOpen,
  Bot,
  BrainCircuit,
  Clock3,
  CornerDownLeft,
  Heading1,
  Heading2,
  Highlighter,
  Italic,
  Mic2,
  Pause,
  Plus,
  Quote,
  Save,
  Text,
  Trash2,
  Volume2,
  Wand2, MoreHorizontal, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from "lucide-react";
import { deleteTalk, createTalkSection, deleteTalkSection, reorderTalkSections, updateTalk, updateTalkSection } from "@/modules/talks/actions";
import { formatDuration, sectionSeconds, wordCount } from "@/lib/utils";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AutosaveStatus, type AutosaveState } from "@/components/talks/AutosaveStatus";
import { ExportPdfButton } from "@/components/talks/ExportPdfButton";
import { ShareButton } from "@/components/talks/ShareButton";
import { TranslateButton } from "@/components/talks/TranslateButton";
import { generateAssistantContent } from "@/modules/assistant/actions";
import { AiPreviewDialog } from "@/modules/assistant/components/ai-preview-dialog";
import { AssistantPanel } from "@/modules/assistant/components/assistant-panel";
import { isAssistantFeatureEnabled } from "@/modules/assistant/feature-registry";
import { useAssistantFeatureSettings } from "@/modules/assistant/feature-settings";
import { getAssistantPrimaryApplyLabel, getAssistantPrimaryApplyMode } from "@/modules/assistant/result-application";
import type { AssistantAction, AssistantGenerateResult, AssistantOutlineSection } from "@/modules/assistant/types";
import { aiEnabledStorageKey, predictiveWritingStorageKey, resolvePredictiveWritingPreference } from "@/modules/settings/studio-preferences";
import { EditorLayoutSwitcher } from "@/modules/studio-layout/components/editor-layout-switcher";
import { FocusModeToggle } from "@/modules/studio-layout/components/focus-mode-toggle";
import { isEditorPanelVisible } from "@/modules/studio-layout/editor-layout-presets";
import { useEditorLayout } from "@/modules/studio-layout/layout-storage";
import { DetailsMenu } from "@/components/ui/DetailsMenu";
import { useStoredBoolean } from "@/lib/use-stored-boolean";
import { useI18n } from "@/i18n/client";
import { localizedPath } from "@/i18n/routing";
import { talkLanguageLabels, talkStatusLabels, talkTypeLabels, type Talk, type TalkLanguage, type TalkSection, type TalkStatus, type TalkType } from "@/types/talk";
import { VoiceSimulatorPanel } from "@/modules/voice-simulator/components/voice-simulator-panel";

type EditableSection = TalkSection & {
  pending?: boolean;
};

type TalkDraft = {
  title: string;
  type: TalkType;
  status: TalkStatus;
  audience: string;
  language: TalkLanguage;
  targetDurationMinutes: number;
  sections: EditableSection[];
};

type PendingAssistantResult = {
  action: AssistantAction;
  result: AssistantGenerateResult;
};

const talkTypes = Object.keys(talkTypeLabels) as TalkType[];
const talkStatuses = Object.keys(talkStatusLabels) as TalkStatus[];
const languages = Object.keys(talkLanguageLabels) as TalkLanguage[];
function toDraft(talk: Talk): TalkDraft {
  return {
    title: talk.title,
    type: talk.type,
    status: talk.status,
    audience: talk.audience,
    language: talk.language,
    targetDurationMinutes: Math.max(1, Math.round(talk.durationMinutes || 10)),
    sections: talk.sections
  };
}

function estimateTotalSeconds(sections: TalkDraft["sections"]) {
  return sections.reduce((total, section) => total + sectionSeconds(section.heading, section.body), 0);
}

function predictionKeyForSection(section: EditableSection) {
  return `${section.id}:${section.body.trim().slice(-520)}`;
}

function bibleSuggestionKeyForSection(section: EditableSection) {
  const body = section.body.trim();
  const sentences = body.match(/[^.!?\n]+[.!?]?/g) ?? [];
  const lastSentence = sentences.at(-1)?.trim() ?? body;
  return `${section.id}:${lastSentence.slice(-360)}`;
}


export function TalkEditor({ canShare = false, canTranslate = false, talk }: { canShare?: boolean; canTranslate?: boolean; talk: Talk }) {
  const { locale, messages } = useI18n();
  const editor = messages.editor;
  const addSectionFailedMessage = messages.errors.addSectionFailed;
  const bibleSuggestionFailedMessage = messages.errors.bibleSuggestionFailed;
  const deleteSectionFailedMessage = messages.errors.deleteSectionFailed;
  const insertPlanFailedMessage = messages.errors.insertPlanFailed;
  const predictionFailedMessage = messages.errors.predictionFailed;
  const saveFailedMessage = messages.errors.saveFailed;
  const [draft, setDraft] = useState<TalkDraft>(() => toDraft(talk));
  const [status, setStatus] = useState<AutosaveState>("idle");
  const [error, setError] = useState("");
  const [activeSectionId, setActiveSectionId] = useState(() => talk.sections[0]?.id ?? "");
  const [aiResult, setAiResult] = useState<PendingAssistantResult | null>(null);
  const [deleteTalkRequested, setDeleteTalkRequested] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<EditableSection | null>(null);
  const [aiEnabled, setAiEnabled] = useStoredBoolean(aiEnabledStorageKey, true);
  const [sectionRailCollapsed, setSectionRailCollapsed] = useStoredBoolean("editor-section-rail-collapsed", false);
  const [assistantRailCollapsed, setAssistantRailCollapsed] = useStoredBoolean("editor-assistant-rail-collapsed", false);
  const [predictiveWritingEnabled, setPredictiveWritingEnabled] = useStoredBoolean(predictiveWritingStorageKey, false);
  const [prediction, setPrediction] = useState("");
  const [predictionContextKey, setPredictionContextKey] = useState("");
  const [predictionError, setPredictionError] = useState("");
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [bibleSuggestion, setBibleSuggestion] = useState<Extract<AssistantGenerateResult, { kind: "bible" }> | null>(null);
  const [bibleSuggestionContextKey, setBibleSuggestionContextKey] = useState("");
  const [bibleSuggestionError, setBibleSuggestionError] = useState("");
  const [bibleSuggestionLoading, setBibleSuggestionLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showVoiceSimulator, setShowVoiceSimulator] = useState(false);
  const [developAllProgress, setDevelopAllProgress] = useState<{ current: number; total: number } | null>(null);
  const preSimulatorPresetRef = useRef<Parameters<typeof setPreset>[0] | null>(null);
  const lastSavedRef = useRef(JSON.stringify(toDraft(talk)));
  const hydratedRef = useRef(false);
  const lastPredictionKeyRef = useRef("");
  const lastBibleSuggestionKeyRef = useRef("");
  const sectionTextareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const { layout: editorLayout, reset: resetEditorLayout, setFocusMode, setPreset } = useEditorLayout();
  const { settings: assistantFeatureSettings } = useAssistantFeatureSettings();

  const totalSeconds = useMemo(() => estimateTotalSeconds(draft.sections), [draft.sections]);
  const totalWords = useMemo(() => draft.sections.reduce((total, section) => total + wordCount(`${section.heading} ${section.body}`), 0), [draft.sections]);
  const activeSection = draft.sections.find((section) => section.id === activeSectionId) ?? draft.sections[0];
  const preparedSections = draft.sections.filter((section) => section.heading.trim() && wordCount(section.body) >= 25).length;
  const hasSectionTargets = draft.sections.some((section) => Boolean(section.targetDurationSec));
  const developAllHint =
    hasSectionTargets && totalSeconds < draft.targetDurationMinutes * 36
      ? editor.developAllHint.replace("{current}", formatDuration(totalSeconds)).replace("{target}", String(draft.targetDurationMinutes))
      : undefined;
  const preparationPercent = draft.sections.length ? Math.round((preparedSections / draft.sections.length) * 100) : 0;
  const focusModeEnabled = editorLayout.focusModeEnabled;
  const showPanel = useCallback((panelId: Parameters<typeof isEditorPanelVisible>[1]) => isEditorPanelVisible(editorLayout, panelId), [editorLayout]);
  const showSectionRail = showPanel("section-rail") && !focusModeEnabled;
  const showAssistantPanel = showPanel("assistant-panel") && !focusModeEnabled;
  const showMetadataBar = showPanel("metadata-bar") && !focusModeEnabled;
  const showEditorToolbar = showPanel("editor-toolbar") || focusModeEnabled;
  const showExportActions = showPanel("export-actions") && !focusModeEnabled;
  const showSpeakingActions = showPanel("speaking-actions") || focusModeEnabled;
  const showTalkHeader = showPanel("talk-header") || focusModeEnabled;
  const showStatusBar = showPanel("status-bar") || focusModeEnabled;
  const bibleSuggestionsEnabled = isAssistantFeatureEnabled("suggest-bible", draft.type, assistantFeatureSettings);

  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }

    const serialized = JSON.stringify(draft);
    if (serialized === lastSavedRef.current) {
      return;
    }

    setStatus("dirty");
    setError("");

    const timeoutId = window.setTimeout(async () => {
      setStatus("saving");

      try {
        await updateTalk({
          id: talk.id,
          title: draft.title,
          type: draft.type,
          status: draft.status,
          audience: draft.audience,
          durationMinutes: draft.targetDurationMinutes,
          language: draft.language
        });

        await Promise.all(
          draft.sections
            .filter((section) => !section.pending)
            .map((section) =>
              updateTalkSection({
                id: section.id,
                talkId: talk.id,
                heading: section.heading,
                body: section.body
              })
            )
        );

        lastSavedRef.current = JSON.stringify(draft);
        setStatus("saved");
      } catch (saveError) {
        setStatus("error");
        setError(saveError instanceof Error ? saveError.message : saveFailedMessage);
      }
    }, 850);

    return () => window.clearTimeout(timeoutId);
  }, [draft, saveFailedMessage, talk.id]);

  useEffect(() => {
    if (!aiEnabled || !predictiveWritingEnabled || !activeSection || activeSection.pending) {
      return;
    }

    const body = activeSection.body.trim();
    if (body.length < 80) {
      return;
    }

    const predictionKey = predictionKeyForSection(activeSection);
    if (lastPredictionKeyRef.current === predictionKey) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      lastPredictionKeyRef.current = predictionKey;
      setPrediction("");
      setPredictionContextKey(predictionKey);
      setPredictionError("");
      setPredictionLoading(true);

      try {
        const result = await generateAssistantContent({
          action: "predict-next",
          talkId: talk.id,
          talk: {
            title: draft.title,
            type: draft.type,
            audience: draft.audience,
            objective: "",
            targetDurationMin: draft.targetDurationMinutes,
            language: draft.language
          },
          section: {
            heading: activeSection.heading,
            body: activeSection.body
          }
        });

        setPrediction(result.kind === "suggestion" ? result.text : "");
        setPredictionContextKey(predictionKey);
      } catch (assistantError) {
        setPredictionError(assistantError instanceof Error ? assistantError.message : predictionFailedMessage);
      } finally {
        setPredictionLoading(false);
      }
    }, 1100);

    return () => window.clearTimeout(timeoutId);
  }, [activeSection, aiEnabled, draft.audience, draft.language, draft.targetDurationMinutes, draft.title, draft.type, predictionFailedMessage, predictiveWritingEnabled, talk.id]);

  useEffect(() => {
    if (!aiEnabled || !bibleSuggestionsEnabled || !activeSection || activeSection.pending) {
      return;
    }

    const body = activeSection.body.trim();
    if (body.length < 60) {
      return;
    }

    const suggestionKey = bibleSuggestionKeyForSection(activeSection);
    if (lastBibleSuggestionKeyRef.current === suggestionKey) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      lastBibleSuggestionKeyRef.current = suggestionKey;
      setBibleSuggestion(null);
      setBibleSuggestionContextKey(suggestionKey);
      setBibleSuggestionError("");
      setBibleSuggestionLoading(true);

      try {
        const result = await generateAssistantContent({
          action: "suggest-bible",
          talkId: talk.id,
          talk: {
            title: draft.title,
            type: draft.type,
            audience: draft.audience,
            objective: "",
            targetDurationMin: draft.targetDurationMinutes,
            language: draft.language
          },
          section: {
            heading: activeSection.heading,
            body: activeSection.body
          }
        });

        setBibleSuggestion(result.kind === "bible" ? result : null);
        setBibleSuggestionContextKey(suggestionKey);
      } catch (assistantError) {
        setBibleSuggestionError(assistantError instanceof Error ? assistantError.message : bibleSuggestionFailedMessage);
      } finally {
        setBibleSuggestionLoading(false);
      }
    }, 1500);

    return () => window.clearTimeout(timeoutId);
  }, [activeSection, aiEnabled, bibleSuggestionFailedMessage, bibleSuggestionsEnabled, draft.audience, draft.language, draft.targetDurationMinutes, draft.title, draft.type, talk.id]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === ".") {
        event.preventDefault();
        setFocusMode(!focusModeEnabled);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusModeEnabled, setFocusMode]);

  function updateSection(sectionId: string, values: Partial<EditableSection>) {
    setDraft((current) => ({
      ...current,
      sections: current.sections.map((section) => (section.id === sectionId ? { ...section, ...values } : section))
    }));
  }

  function insertIntoSection(section: EditableSection, text: string) {
    const textarea = sectionTextareaRefs.current[section.id];
    const currentBody = section.body ?? "";
    const start = textarea?.selectionStart ?? currentBody.length;
    const end = textarea?.selectionEnd ?? currentBody.length;
    const nextBody = `${currentBody.slice(0, start)}${text}${currentBody.slice(end)}`;

    updateSection(section.id, { body: nextBody });
    setActiveSectionId(section.id);

    window.requestAnimationFrame(() => {
      const nextCursor = start + text.length;
      textarea?.focus();
      textarea?.setSelectionRange(nextCursor, nextCursor);
    });
  }

  function formatSelectionInSection(section: EditableSection, before: string, after = before, placeholder = editor.selectionPlaceholder) {
    const textarea = sectionTextareaRefs.current[section.id];
    const currentBody = section.body ?? "";
    const start = textarea?.selectionStart ?? currentBody.length;
    const end = textarea?.selectionEnd ?? currentBody.length;
    const selectedText = currentBody.slice(start, end) || placeholder;
    const nextBody = `${currentBody.slice(0, start)}${before}${selectedText}${after}${currentBody.slice(end)}`;
    const selectionStart = start + before.length;
    const selectionEnd = selectionStart + selectedText.length;

    updateSection(section.id, { body: nextBody });
    setActiveSectionId(section.id);

    window.requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(selectionStart, selectionEnd);
    });
  }

  function insertPrediction() {
    if (!activeSection || !prediction) return;
    const prefix = activeSection.body.trimEnd() === activeSection.body ? " " : "";
    insertIntoSection(activeSection, `${prefix}${prediction}`);
    posthog.capture("ai_suggestion_inserted", { type: "prediction", talk_type: draft.type });
    setPrediction("");
  }

  function insertBibleReferenceInline() {
    if (!activeSection || !bibleSuggestion) return;
    insertIntoSection(activeSection, ` (${bibleSuggestion.reference})`);
    setBibleSuggestion(null);
  }

  function insertFullBibleQuote() {
    if (!activeSection || !bibleSuggestion) return;
    insertIntoSection(activeSection, `\n\n_"${bibleSuggestion.text}"_ (${bibleSuggestion.reference})`);
    setBibleSuggestion(null);
  }

  function closeAiPreview() {
    setAiResult(null);
  }

  function setAssistantResult(result: AssistantGenerateResult, action: AssistantAction) {
    setAiResult({ action, result });
  }

  function appendToActiveSection(result: Extract<AssistantGenerateResult, { kind: "section" }>) {
    if (!activeSection) return;

    const nextBody = [activeSection.body.trim(), result.body.trim()].filter(Boolean).join("\n\n");
    updateSection(activeSection.id, {
      heading: activeSection.heading || result.heading || editor.untitled,
      body: nextBody
    });
    closeAiPreview();
  }

  async function developAllSections() {
    const targets = draft.sections.filter((section) => !section.pending);
    if (!targets.length || developAllProgress) return;

    posthog.capture("ai_develop_all_used", { sections: targets.length, talk_type: draft.type });

    try {
      for (let index = 0; index < targets.length; index += 1) {
        const section = targets[index];
        setDevelopAllProgress({ current: index + 1, total: targets.length });

        const result = await generateAssistantContent({
          action: "expand-section",
          talkId: talk.id,
          talk: {
            title: draft.title,
            type: draft.type,
            audience: draft.audience,
            objective: "",
            targetDurationMin: draft.targetDurationMinutes,
            language: draft.language
          },
          section: {
            heading: section.heading,
            body: section.body,
            targetDurationMin: section.targetDurationSec ? Math.max(1, Math.round(section.targetDurationSec / 60)) : undefined
          }
        });

        if (result.kind !== "section") continue;
        const heading = result.heading || section.heading || editor.untitled;
        updateSection(section.id, { heading, body: result.body });
        await updateTalkSection({
          id: section.id,
          talkId: talk.id,
          heading,
          body: result.body
        });
      }
    } catch (developError) {
      setError(developError instanceof Error ? developError.message : saveFailedMessage);
    } finally {
      setDevelopAllProgress(null);
    }
  }

  function replaceActiveSection(result: Extract<AssistantGenerateResult, { kind: "section" }>) {
    if (!activeSection) return;

    updateSection(activeSection.id, {
      heading: result.heading || activeSection.heading || editor.untitled,
      body: result.body
    });
    closeAiPreview();
  }

  function insertBibleSuggestion(result: Extract<AssistantGenerateResult, { kind: "bible" }>) {
    if (!activeSection) return;

    insertIntoSection(activeSection, `\n\n${result.reference} - ${result.text}\n${result.reason}`);
    closeAiPreview();
  }

  function insertOutlineSections(sections: AssistantOutlineSection[]) {
    const tempSections = sections.map((section, index) => ({
      id: `pending-ai-${Date.now()}-${index}`,
      heading: section.heading || editor.untitled,
      body: section.body,
      position: draft.sections.length + index,
      targetDurationSec: section.targetDurationSec ?? null,
      pending: true
    }));

    setDraft((current) => ({
      ...current,
      sections: [...current.sections, ...tempSections]
    }));
    setActiveSectionId(tempSections[0]?.id ?? activeSectionId);
    closeAiPreview();

    startTransition(async () => {
      try {
        const createdSections: EditableSection[] = [];

        for (const section of sections) {
          const created = await createTalkSection(talk.id);
          await updateTalkSection({
            id: created.id,
            talkId: talk.id,
            heading: section.heading,
            body: section.body,
            targetDurationSec: section.targetDurationSec ?? null
          });
          createdSections.push({ ...created, heading: section.heading, body: section.body, targetDurationSec: section.targetDurationSec ?? null });
        }

        setDraft((current) => {
          const pendingIds = new Set(tempSections.map((section) => section.id));
          const existing = current.sections.filter((section) => !pendingIds.has(section.id));
          const next = {
            ...current,
            sections: [...existing, ...createdSections].map((section, position) => ({ ...section, position }))
          };
          lastSavedRef.current = JSON.stringify(next);
          return next;
        });
        setActiveSectionId(createdSections[0]?.id ?? activeSectionId);
        setStatus("saved");
      } catch (sectionError) {
        setDraft((current) => ({
          ...current,
          sections: current.sections.filter((section) => !tempSections.some((pendingSection) => pendingSection.id === section.id))
        }));
        setStatus("error");
        setError(sectionError instanceof Error ? sectionError.message : insertPlanFailedMessage);
      }
    });
  }

  function applyPrimaryAssistantResult() {
    if (!aiResult) return;

    const { action, result } = aiResult;
    posthog.capture("ai_suggestion_inserted", { type: action, kind: result.kind, talk_type: draft.type });

    if (result.kind === "outline") {
      insertOutlineSections(result.sections);
    } else if (result.kind === "bible") {
      insertBibleSuggestion(result);
    } else if (result.kind === "suggestion") {
      if (activeSection) insertIntoSection(activeSection, result.text);
      closeAiPreview();
    } else if (getAssistantPrimaryApplyMode(action, result) === "replace") {
      replaceActiveSection(result);
    } else {
      appendToActiveSection(result);
    }
  }

  function replaceAiResultSection() {
    if (aiResult?.result.kind !== "section") return;
    replaceActiveSection(aiResult.result);
  }

  function addSection() {
    const tempId = `pending-${Date.now()}`;
    setDraft((current) => ({
      ...current,
      sections: [
        ...current.sections,
        {
          id: tempId,
          heading: editor.newSectionTitle,
          body: "",
          position: current.sections.length,
          pending: true
        }
      ]
    }));
    setActiveSectionId(tempId);

    startTransition(async () => {
      try {
        const section = await createTalkSection(talk.id);
        setDraft((current) => {
          const next = {
            ...current,
            sections: current.sections.map((item) => (item.id === tempId ? section : item))
          };
          lastSavedRef.current = JSON.stringify(next);
          return next;
        });
        setActiveSectionId(section.id);
        setStatus("saved");
      } catch (sectionError) {
        setDraft((current) => ({
          ...current,
          sections: current.sections.filter((section) => section.id !== tempId)
        }));
        setStatus("error");
        setError(sectionError instanceof Error ? sectionError.message : addSectionFailedMessage);
      }
    });
  }

  function removeSection(sectionId: string) {
    const previous = draft.sections;
    const nextSections = previous.filter((section) => section.id !== sectionId).map((section, position) => ({ ...section, position }));
    setDraft((current) => ({ ...current, sections: nextSections }));

    startTransition(async () => {
      try {
        await deleteTalkSection(sectionId, talk.id);
        lastSavedRef.current = JSON.stringify({ ...draft, sections: nextSections });
        setStatus("saved");
      } catch (sectionError) {
        setDraft((current) => ({ ...current, sections: previous }));
        setStatus("error");
        setError(sectionError instanceof Error ? sectionError.message : deleteSectionFailedMessage);
      }
    });
  }

  function moveSection(sectionId: string, direction: -1 | 1) {
    const index = draft.sections.findIndex((section) => section.id === sectionId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= draft.sections.length) return;

    const nextSections = [...draft.sections];
    const [moved] = nextSections.splice(index, 1);
    nextSections.splice(targetIndex, 0, moved);
    const positioned = nextSections.map((section, position) => ({ ...section, position }));
    setDraft((current) => ({ ...current, sections: positioned }));

    startTransition(async () => {
      try {
        await reorderTalkSections(talk.id, positioned.filter((section) => !section.pending).map((section) => section.id));
        lastSavedRef.current = JSON.stringify({ ...draft, sections: positioned });
        setStatus("saved");
      } catch (sectionError) {
        setStatus("error");
        setError(sectionError instanceof Error ? sectionError.message : editor.reorderError);
      }
    });
  }

  const mobileAssistantPanel = showAssistantPanel ? (
    <details className="mb-5 rounded-[12px] border border-border bg-surface shadow-[0_1px_2px_rgba(20,20,25,.03)] xl:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 marker:hidden">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-accent-muted text-accent-ink">
          <Wand2 className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[14px] font-semibold tracking-[0] text-foreground">{editor.assistantTitle}</p>
          <p className="m-0 mt-0.5 truncate text-[12.5px] text-muted">{editor.assistantDescription}</p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[.08em] text-faint">{editor.open}</span>
      </summary>
      <div className="border-t border-line2 p-3">
        {aiEnabled ? (
          <AssistantPanel
            activeSection={activeSection ? { heading: activeSection.heading, body: activeSection.body } : undefined}
            audience={draft.audience}
            className="border-0 bg-transparent p-0 shadow-none"
            durationMinutes={draft.targetDurationMinutes}
            developAllProgress={developAllProgress}
            developAllHint={developAllHint}
            hasSectionTargets={hasSectionTargets}
            onDevelopAll={developAllSections}
            onDurationChange={(minutes) => setDraft((current) => ({ ...current, targetDurationMinutes: minutes }))}
            language={draft.language}
            onResult={setAssistantResult}
            talkId={talk.id}
            title={draft.title}
            type={draft.type}
          />
        ) : (
          <div className="flex items-start gap-3 rounded-[10px] bg-background p-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-panel text-faint">
              <Bot className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="m-0 text-[14px] font-semibold tracking-[0] text-foreground">{editor.assistantOffTitle}</h2>
              <p className="mt-1 text-[12.5px] leading-5 text-muted">{editor.assistantOffBody}</p>
            </div>
            <Button onClick={() => setAiEnabled(true)} size="sm" type="button" variant="ghost">{editor.activate}</Button>
          </div>
        )}
      </div>
    </details>
  ) : null;

  return (
    <div className={`flex h-screen min-w-0 flex-col bg-background text-foreground ${focusModeEnabled ? "fixed inset-0 z-40" : ""}`}>
      {showTalkHeader ? (
      <header className={`flex min-w-0 shrink-0 items-center gap-3 border-b border-border bg-background px-4 ${focusModeEnabled ? "h-[56px]" : "h-[52px]"}`}>
        <Link href={localizedPath("/talks", locale)}>
          <Button aria-label={editor.back} size="icon" variant="quiet">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex min-w-0 items-center gap-2 text-[13px] text-muted">
          <span className="hidden whitespace-nowrap sm:inline">{messages.navigation.talks}</span>
          <span className="text-faint">/</span>
          <b className="truncate font-[550] text-foreground">{draft.title || editor.untitled}</b>
        </div>
        <div className="ml-auto flex shrink-0 items-center justify-end gap-2 whitespace-nowrap">
          <div className="hidden lg:block">
            <FocusModeToggle enabled={focusModeEnabled} onToggle={() => setFocusMode(!focusModeEnabled)} />
          </div>
          <div className="hidden sm:block">
            <AutosaveStatus state={isPending && status !== "saving" ? "saving" : status} />
          </div>
          {showSpeakingActions ? <Link href={localizedPath(`/talks/${talk.id}/speak`, locale)} data-tour="prompter-action" onClick={() => posthog.capture("speaking_session_started", { talk_type: draft.type, talk_language: draft.language, section_count: draft.sections.length, total_words: totalWords })}>
            <Button leftIcon={<Mic2 />} size="sm" type="button" variant="primary">{editor.present}</Button>
          </Link> : null}
          <DetailsMenu className="relative">
            <summary aria-label={editor.moreActions} className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-[8px] border border-border bg-surface text-muted transition hover:text-foreground [&::-webkit-details-marker]:hidden" title={editor.moreActions}>
              <MoreHorizontal className="size-4" />
            </summary>
            <div className="absolute right-0 top-[calc(100%+8px)] z-40 grid w-64 gap-1 rounded-[12px] border border-border bg-surface p-2 shadow-[0_16px_40px_rgba(0,0,0,.4)]">
              <div className="px-1 py-1" data-menu-keep-open="true">
                <EditorLayoutSwitcher onReset={resetEditorLayout} onSelect={setPreset} value={editorLayout.preset} />
              </div>
              <div className="flex items-center justify-between gap-2 px-1 font-mono text-[10.5px] text-faint">
                <span className="flex items-center gap-1.5"><Clock3 className="size-3.5" />{editor.estimatedDuration}</span>
                <span>{formatDuration(totalSeconds)}</span>
              </div>
              {showAssistantPanel ? (
                <Button
                  aria-pressed={aiEnabled}
                  className={`justify-start ${aiEnabled ? "" : "text-faint"}`}
                  leftIcon={<Bot />}
                  onClick={() => {
                    setAiEnabled((current) => !current);
                    setPrediction("");
                    setPredictionError("");
                    setBibleSuggestion(null);
                    setBibleSuggestionError("");
                  }}
                  size="sm"
                  type="button"
                  variant={aiEnabled ? "ghost" : "quiet"}
                >
                  {aiEnabled ? editor.aiActive : editor.aiOff}
                </Button>
              ) : null}
              {showSpeakingActions ? (
                <Button
                  className="justify-start"
                  leftIcon={<Volume2 />}
                  onClick={() => {
                    if (showVoiceSimulator) {
                      setShowVoiceSimulator(false);
                      if (preSimulatorPresetRef.current) {
                        setPreset(preSimulatorPresetRef.current);
                        preSimulatorPresetRef.current = null;
                      }
                    } else {
                      preSimulatorPresetRef.current = editorLayout.preset;
                      setPreset("rehearsal");
                      setShowVoiceSimulator(true);
                    }
                  }}
                  size="sm"
                  type="button"
                  variant={showVoiceSimulator ? "accent" : "ghost"}
                >
                  {editor.simulateVoice}
                </Button>
              ) : null}
              {showExportActions ? (
                <div className="grid gap-1 border-t border-line2 pt-1.5">
                  <ExportPdfButton talkId={talk.id} title={draft.title} />
                  <ShareButton canShare={canShare} shareToken={talk.shareToken} talkId={talk.id} />
                  <TranslateButton canTranslate={canTranslate} sourceLang={draft.language} talkId={talk.id} />
                </div>
              ) : null}
              {!focusModeEnabled ? (
                <div className="border-t border-line2 pt-1.5">
                  <Button className="w-full justify-start text-red-500" leftIcon={<Trash2 />} onClick={() => setDeleteTalkRequested(true)} size="sm" type="button" variant="quiet">
                    {editor.delete}
                  </Button>
                </div>
              ) : null}
            </div>
          </DetailsMenu>
        </div>
      </header>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1">
        {showSectionRail && sectionRailCollapsed ? (
          <aside className="hidden shrink-0 border-r border-border bg-background px-1.5 py-4 lg:flex lg:flex-col lg:items-center lg:gap-2">
            <Button aria-label={editor.expandRail} onClick={() => setSectionRailCollapsed(false)} size="icon" title={editor.expandRail} type="button" variant="quiet">
              <PanelLeftOpen className="size-4" />
            </Button>
            <span className="font-mono text-[10px] text-faint">{draft.sections.length}</span>
          </aside>
        ) : null}
        {showSectionRail && !sectionRailCollapsed ? <aside className="hidden w-[236px] shrink-0 overflow-y-auto border-r border-border bg-background px-3 py-5 lg:block">
          <div className="mb-2 flex items-center justify-between px-2.5">
            <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">{editor.plan}</p>
            <span className="flex items-center gap-1 font-mono text-[10px] text-faint">
              {draft.sections.length}
              <button aria-label={editor.collapseRail} className="ml-1 flex size-6 items-center justify-center rounded-[6px] text-faint transition hover:bg-panel hover:text-foreground" onClick={() => setSectionRailCollapsed(true)} title={editor.collapseRail} type="button">
                <PanelLeftClose className="size-3.5" />
              </button>
            </span>
          </div>
          <div className="mb-3 rounded-[10px] border border-border bg-surface p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[.1em] text-faint">{editor.preparation}</span>
              <span className="text-[12px] font-semibold text-foreground">{preparationPercent}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-panel">
              <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${preparationPercent}%` }} />
            </div>
            <div className="mt-2 flex justify-between gap-2 font-mono text-[10px] text-faint">
              <span>{editor.sectionsReady.replace("{ready}", String(preparedSections)).replace("{total}", String(draft.sections.length))}</span>
              <span>{totalWords} {editor.words}</span>
            </div>
          </div>
          <div className="grid gap-1">
            {draft.sections.map((section, index) => {
              const sectionWordCount = wordCount(section.body);
              const sectionReady = section.heading.trim() && sectionWordCount >= 25;
              const active = section.id === activeSection?.id;
              return (
              <a
                className={`grid gap-1 rounded-[9px] border px-2.5 py-2.5 text-[12.5px] transition hover:bg-panel hover:text-foreground ${
                  active ? "border-border bg-surface font-[550] text-foreground shadow-[0_1px_2px_rgba(20,20,25,.03)]" : "border-transparent text-muted"
                }`}
                href={`#${section.id}`}
                key={section.id}
                onClick={() => setActiveSectionId(section.id)}
              >
                <span className="flex min-w-0 items-start gap-2">
                  <span className={`font-mono text-[10px] ${active ? "text-accent-ink" : "text-faint"}`}>{String(index + 1).padStart(2, "0")}</span>
                  <span className="break-words">{section.heading || editor.untitled}</span>
                </span>
                <span className="flex items-center justify-between gap-2 font-mono text-[10px] text-faint">
                  <span>{sectionWordCount} {editor.words}</span>
                  <span>
                    {formatDuration(sectionSeconds(section.heading, section.body))}
                    {section.targetDurationSec ? ` / ${formatDuration(section.targetDurationSec)}` : ""}
                  </span>
                  <span className={`size-1.5 rounded-full ${sectionReady ? "bg-ok" : "bg-line"}`} />
                </span>
              </a>
            );})}
          </div>
          <button className="mt-3 flex w-full items-center gap-2 rounded-[7px] px-2.5 py-2 text-[12.5px] font-[550] text-muted transition hover:bg-panel hover:text-foreground" onClick={addSection} type="button">
            <Plus className="size-3.5" />
            {editor.addSection}
          </button>
          <div className="mt-3 grid gap-1 border-t border-line2 px-2.5 pt-3 font-mono text-[10.5px] text-faint">
            <div className="flex justify-between gap-2">
              <span>{editor.totalEstimated}</span>
              <span>{formatDuration(totalSeconds)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>{editor.target}</span>
              <span>{draft.targetDurationMinutes} min</span>
            </div>
          </div>
        </aside> : null}

        <main className="studio-scroll min-w-0 flex-1 overflow-y-auto bg-background">
          <div className={`mx-auto flex w-full gap-5 px-4 pb-32 pt-6 sm:px-5 md:px-8 md:pb-28 md:pt-7 ${focusModeEnabled ? "max-w-[920px]" : showAssistantPanel ? "max-w-[1480px]" : "max-w-[1180px]"}`}>
            <article className="min-w-0 flex-1">
              <div className={`mb-5 grid gap-4 rounded-[14px] border border-border bg-surface shadow-[0_1px_2px_rgba(20,20,25,.03)] ${focusModeEnabled ? "p-3 md:p-4" : "p-4 sm:p-5"}`}>
                {showMetadataBar ? <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="accent">{talkTypeLabels[draft.type]}</Badge>
                  <Badge>{talkStatusLabels[draft.status]}</Badge>
                  <Badge>{draft.language}</Badge>
                  {draft.audience ? <Badge>{draft.audience}</Badge> : null}
                </div> : null}
                <input
                  className={`w-full bg-transparent font-semibold leading-[1.15] tracking-[0] text-foreground outline-none placeholder:text-faint ${focusModeEnabled ? "text-[24px]" : "studio-title-input"}`}
                  onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder={editor.talkTitlePlaceholder}
                  value={draft.title}
                />
                {showMetadataBar ? <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] text-faint">
                  <Clock3 className="size-3.5" />
                  <span className="text-foreground">{formatDuration(totalSeconds)} / {draft.targetDurationMinutes} min</span>
                  <span className="h-3 w-px bg-line" />
                  <span>{totalWords} {editor.words}</span>
                  <span className="h-3 w-px bg-line" />
                  <span>{preparedSections}/{draft.sections.length} {editor.readySections.toLowerCase()}</span>
                </div> : null}
                {showMetadataBar ? <div className="grid gap-2.5 md:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,0.9fr)]">
                  <input
                    className="studio-input h-9 rounded-[8px] border border-border bg-background px-3 text-foreground outline-none placeholder:text-faint focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_16%,transparent)]"
                    onChange={(event) => setDraft((current) => ({ ...current, audience: event.target.value }))}
                    placeholder={editor.audiencePlaceholder}
                    value={draft.audience}
                  />
                  <select className="studio-input h-9 rounded-[8px] border border-border bg-background px-3 text-foreground outline-none focus:border-accent" onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as TalkType }))} value={draft.type}>
                    {talkTypes.map((type) => (
                      <option key={type} value={type}>{talkTypeLabels[type]}</option>
                    ))}
                  </select>
                  <select className="studio-input h-9 rounded-[8px] border border-border bg-background px-3 text-foreground outline-none focus:border-accent" onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as TalkStatus }))} value={draft.status}>
                    {talkStatuses.map((item) => (
                      <option key={item} value={item}>{talkStatusLabels[item]}</option>
                    ))}
                  </select>
                  <select className="studio-input h-9 rounded-[8px] border border-border bg-background px-3 text-foreground outline-none focus:border-accent" onChange={(event) => setDraft((current) => ({ ...current, language: event.target.value as TalkLanguage }))} value={draft.language}>
                    {languages.map((language) => (
                      <option key={language} value={language}>{talkLanguageLabels[language]}</option>
                    ))}
                  </select>
                </div> : null}
                {showEditorToolbar ? <div className="flex flex-wrap items-center gap-2 border-t border-line2 pt-3">
                  {!showAssistantPanel && !focusModeEnabled ? (
                    <Button leftIcon={<Wand2 />} onClick={() => setPreset("ai")} size="sm" type="button" variant="ghost">{editor.aiMode}</Button>
                  ) : null}
                  <button
                    aria-pressed={aiEnabled}
                    className={`inline-flex h-8 items-center gap-2 rounded-[8px] border px-2.5 text-[12px] font-[550] transition ${
                      aiEnabled ? "border-accent bg-accent-muted text-accent-ink" : "border-border bg-background text-muted hover:text-foreground"
                    }`}
                    onClick={() => {
                      setAiEnabled((current) => !current);
                      setPrediction("");
                      setPredictionError("");
                      setBibleSuggestion(null);
                      setBibleSuggestionError("");
                    }}
                    type="button"
                  >
                    <Bot className="size-3.5" />
                    {editor.assistantTitle}
                  </button>
                  <button
                    aria-pressed={predictiveWritingEnabled}
                    className={`inline-flex h-8 items-center gap-2 rounded-[8px] border px-2.5 text-[12px] font-[550] transition ${
                      predictiveWritingEnabled
                        ? "border-accent bg-accent-muted text-accent-ink"
                        : "border-border bg-background text-muted hover:text-foreground"
                    }`}
                    onClick={() => {
                      const nextPreferences = resolvePredictiveWritingPreference(
                        { aiEnabled, predictiveWritingEnabled },
                        !predictiveWritingEnabled
                      );
                      setAiEnabled(nextPreferences.aiEnabled);
                      setPredictiveWritingEnabled(nextPreferences.predictiveWritingEnabled);
                      setPrediction("");
                      setPredictionError("");
                    }}
                    type="button"
                  >
                    <BrainCircuit className="size-3.5" />
                    {editor.predictiveWriting}
                  </button>
                </div> : null}
                {error ? <Alert>{error}</Alert> : null}
              </div>

              {mobileAssistantPanel}

            {draft.sections.length ? (
              <div className="grid gap-4">
                {draft.sections.map((section, index) => (
                  <section
                    className={`overflow-hidden rounded-[14px] border bg-surface shadow-[0_1px_2px_rgba(20,20,25,.03)] transition ${
                      section.pending ? "opacity-70" : ""
                    } ${section.id === activeSection?.id ? "border-accent bg-[color-mix(in_oklab,var(--accent)_3%,var(--surface))]" : "border-border"
                    }`}
                    id={section.id}
                    key={section.id}
                    onFocusCapture={() => setActiveSectionId(section.id)}
                    onPointerDown={() => setActiveSectionId(section.id)}
                  >
                    <div className="border-b border-line2 bg-[color-mix(in_oklab,var(--panel)_55%,var(--surface))] px-3.5 py-3 sm:px-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-surface font-mono text-[10.5px] text-faint">{String(index + 1).padStart(2, "0")}</span>
                        <div className="min-w-0 flex-1">
                          <input
                            className="h-8 w-full min-w-0 bg-transparent text-[16px] font-semibold tracking-[0] text-foreground outline-none placeholder:text-faint"
                            onChange={(event) => updateSection(section.id, { heading: event.target.value })}
                            placeholder={editor.sectionTitlePlaceholder}
                            value={section.heading}
                          />
                          <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10.5px] text-faint">
                            <span>{wordCount(section.body)} {editor.words}</span>
                            <span className="h-3 w-px bg-line" />
                            <span>{formatDuration(sectionSeconds(section.heading, section.body))}</span>
                            {section.id === activeSection?.id ? <span className="rounded-[5px] bg-accent-muted px-1.5 py-0.5 text-accent-ink">{editor.active}</span> : null}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button aria-label={editor.moveUp} disabled={index === 0 || section.pending} onClick={() => moveSection(section.id, -1)} size="icon" type="button" variant="quiet">
                            <ArrowUp className="size-4" />
                          </Button>
                          <Button aria-label={editor.moveDown} disabled={index === draft.sections.length - 1 || section.pending} onClick={() => moveSection(section.id, 1)} size="icon" type="button" variant="quiet">
                            <ArrowDown className="size-4" />
                          </Button>
                          <Button aria-label={editor.deleteSection} disabled={section.pending} onClick={() => setSectionToDelete(section)} size="icon" type="button" variant="quiet">
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="p-3.5 sm:p-4">
                    {showEditorToolbar ? <div className="mb-3 grid gap-1.5 rounded-[8px] border border-line2 bg-background px-2 py-1.5 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-2">
                      <div className="flex min-w-0 items-center gap-1 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
                        <Button aria-label={editor.heading1} className="h-7 shrink-0 px-2" onClick={() => formatSelectionInSection(section, "# ", "", editor.heading1)} size="sm" title={editor.heading1} type="button" variant="quiet">
                          <Heading1 className="size-4" />
                        </Button>
                        <Button aria-label={editor.heading2} className="h-7 shrink-0 px-2" onClick={() => formatSelectionInSection(section, "## ", "", editor.heading2)} size="sm" title={editor.heading2} type="button" variant="quiet">
                          <Heading2 className="size-4" />
                        </Button>
                        <Button aria-label={editor.bold} className="h-7 shrink-0 px-2" onClick={() => formatSelectionInSection(section, "**", "**")} size="sm" title={editor.bold} type="button" variant="quiet">
                          <Bold className="size-4" />
                        </Button>
                        <Button aria-label={editor.italic} className="h-7 shrink-0 px-2" onClick={() => formatSelectionInSection(section, "_", "_")} size="sm" title={editor.italic} type="button" variant="quiet">
                          <Italic className="size-4" />
                        </Button>
                        <Button aria-label={editor.highlight} className="h-7 shrink-0 px-2" onClick={() => formatSelectionInSection(section, "==", "==")} size="sm" title={editor.highlight} type="button" variant="quiet">
                          <Highlighter className="size-4" />
                        </Button>
                        <Button aria-label={editor.largerText} className="h-7 shrink-0 px-2" onClick={() => formatSelectionInSection(section, "<big>", "</big>")} size="sm" title={editor.largerText} type="button" variant="quiet">
                          <Text className="size-4" />
                        </Button>
                        <Button aria-label={editor.smallerText} className="h-7 shrink-0 px-2 text-[10.5px]" onClick={() => formatSelectionInSection(section, "<small>", "</small>")} size="sm" title={editor.smallerText} type="button" variant="quiet">
                          <Text className="size-3.5" />
                        </Button>
                        <span className="mx-1 h-4 w-px shrink-0 bg-line" />
                        <Button
                          className="h-7 shrink-0 px-2.5 text-[11.5px]"
                          leftIcon={<Pause />}
                          onClick={() => insertIntoSection(section, "[pause 2s]")}
                          size="sm"
                          title={editor.shortPause}
                          type="button"
                          variant="quiet"
                        >
                          2s
                        </Button>
                        <Button
                          className="h-7 shrink-0 px-2.5 text-[11.5px]"
                          leftIcon={<Pause />}
                          onClick={() => insertIntoSection(section, "[pause 5s]")}
                          size="sm"
                          title={editor.longPause}
                          type="button"
                          variant="quiet"
                        >
                          5s
                        </Button>
                        <Button
                          className="h-7 shrink-0 px-2.5 text-[11.5px]"
                          leftIcon={<CornerDownLeft />}
                          onClick={() => insertIntoSection(section, "\n\n")}
                          size="sm"
                          title={editor.newParagraph}
                          type="button"
                          variant="quiet"
                        >
                          ¶
                        </Button>
                      </div>
                    </div> : null}
                    <textarea
                      className={`studio-textarea w-full resize-y rounded-[10px] border border-border bg-background px-4 py-3 text-foreground outline-none placeholder:text-faint focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_16%,transparent)] ${focusModeEnabled ? "min-h-64 leading-8" : "min-h-48 leading-7"}`}
                      onChange={(event) => updateSection(section.id, { body: event.target.value })}
                      placeholder={editor.sectionBodyPlaceholder}
                      ref={(element) => {
                        sectionTextareaRefs.current[section.id] = element;
                      }}
                      value={section.body}
                    />
                    {aiEnabled && predictiveWritingEnabled && section.id === activeSection?.id && section.body.trim().length >= 80 ? (
                      <div className="mt-2 rounded-[8px] border border-line2 bg-background px-3 py-2">
                        {prediction && predictionContextKey === predictionKeyForSection(section) ? (
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <p className="m-0 min-w-0 flex-1 text-[12.5px] leading-5 text-muted">
                              <span className="font-[550] text-foreground">{editor.suggestedNext}</span>
                              {prediction}
                            </p>
                            <Button onClick={insertPrediction} size="sm" type="button" variant="ghost">{editor.insert}</Button>
                          </div>
                        ) : (
                          <p className="m-0 text-[12px] leading-5 text-faint">
                            {predictionLoading && predictionContextKey === predictionKeyForSection(section)
                              ? editor.predictionLoading
                              : predictionError || editor.predictionEmpty}
                          </p>
                        )}
                      </div>
                    ) : null}
                    {aiEnabled && bibleSuggestionsEnabled && section.id === activeSection?.id && section.body.trim().length >= 60 ? (
                      <div className="mt-2 rounded-[8px] border border-[color-mix(in_oklab,var(--accent)_22%,var(--line))] bg-[color-mix(in_oklab,var(--accent)_5%,var(--bg))] px-3 py-2">
                        {bibleSuggestion && bibleSuggestionContextKey === bibleSuggestionKeyForSection(section) ? (
                          <div className="grid gap-2">
                            <div className="flex items-start gap-2">
                              <BookOpen className="mt-0.5 size-4 shrink-0 text-accent-ink" />
                              <div className="min-w-0 flex-1">
                                <p className="m-0 text-[12.5px] font-[550] leading-5 text-foreground">
                                  {bibleSuggestion.reference}
                                </p>
                                <p className="m-0 mt-0.5 text-[12.5px] leading-5 text-muted">{bibleSuggestion.reason}</p>
                              </div>
                            </div>
                            <p className="m-0 border-l-2 border-accent px-2 text-[12.5px] italic leading-5 text-muted">
                              &quot;{bibleSuggestion.text}&quot;
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Button leftIcon={<BookOpen />} onClick={insertBibleReferenceInline} size="sm" type="button" variant="ghost">
                                {editor.addReference.replace("{reference}", bibleSuggestion.reference)}
                              </Button>
                              <Button leftIcon={<Quote />} onClick={insertFullBibleQuote} size="sm" type="button" variant="ghost">
                                {editor.insertVerse}
                              </Button>
                              <Button onClick={() => setBibleSuggestion(null)} size="sm" type="button" variant="quiet">
                                {editor.ignore}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="m-0 text-[12px] leading-5 text-faint">
                            {bibleSuggestionLoading && bibleSuggestionContextKey === bibleSuggestionKeyForSection(section)
                              ? editor.bibleLoading
                              : bibleSuggestionError || editor.bibleEmpty}
                          </p>
                        )}
                      </div>
                    ) : null}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="rounded-[12px] border border-dashed border-border bg-panel px-5 py-10 text-center">
                <p className="m-0 text-[15px] font-semibold text-foreground">{editor.noSectionTitle}</p>
                <p className="mx-auto mb-4 mt-1 max-w-sm text-[13px] leading-6 text-muted">{editor.noSectionBody}</p>
                <Button leftIcon={<Plus />} onClick={addSection} type="button" variant="primary">{editor.addSection}</Button>
              </div>
            )}

            {showStatusBar ? <div className="sticky bottom-4 mt-6 flex justify-end">
              <div className="flex items-center gap-2 rounded-[10px] border border-border bg-surface px-3 py-2 shadow-studio">
                <Save className="size-4 text-faint" />
                <AutosaveStatus state={status} />
                {focusModeEnabled ? <Button onClick={() => setFocusMode(false)} size="sm" type="button" variant="ghost">{editor.quitFocus}</Button> : null}
              </div>
            </div> : null}
            </article>

            {showAssistantPanel && assistantRailCollapsed ? (
              <aside className="hidden shrink-0 self-start xl:sticky xl:top-6 xl:block">
                <Button aria-label={editor.expandAssistant} onClick={() => setAssistantRailCollapsed(false)} size="icon" title={editor.expandAssistant} type="button" variant="quiet">
                  <PanelRightOpen className="size-4" />
                </Button>
              </aside>
            ) : null}
            {showAssistantPanel && !assistantRailCollapsed ? <aside className="hidden w-[286px] shrink-0 self-start xl:sticky xl:top-6 xl:block" data-tour="editor-assistant">
                <div className="mb-2 flex justify-end">
                  <button aria-label={editor.collapseAssistant} className="flex size-6 items-center justify-center rounded-[6px] text-faint transition hover:bg-panel hover:text-foreground" onClick={() => setAssistantRailCollapsed(true)} title={editor.collapseAssistant} type="button">
                    <PanelRightClose className="size-3.5" />
                  </button>
                </div>
                {aiEnabled ? (
                  <AssistantPanel
                    activeSection={activeSection ? { heading: activeSection.heading, body: activeSection.body } : undefined}
                    audience={draft.audience}
                    durationMinutes={draft.targetDurationMinutes}
                    developAllProgress={developAllProgress}
                    developAllHint={developAllHint}
                    hasSectionTargets={hasSectionTargets}
                    onDevelopAll={developAllSections}
                    onDurationChange={(minutes) => setDraft((current) => ({ ...current, targetDurationMinutes: minutes }))}
                    language={draft.language}
                    onResult={setAssistantResult}
                    talkId={talk.id}
                    title={draft.title}
                    type={draft.type}
                  />
                ) : (
                  <div className="rounded-[12px] border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(20,20,25,.03)]">
                    <div className="mb-4 flex items-start gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-panel text-faint">
                        <Bot className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="m-0 text-[15px] font-semibold tracking-[0] text-foreground">{editor.assistantOffTitle}</h2>
                        <p className="mt-1 text-[12.5px] leading-5 text-muted">{editor.assistantOffBody}</p>
                      </div>
                    </div>
                    <Button leftIcon={<Bot />} onClick={() => setAiEnabled(true)} size="sm" type="button" variant="ghost">{editor.reactivateAi}</Button>
                  </div>
                )}
            </aside> : null}
          </div>
        </main>
        </div>
        {showVoiceSimulator ? (
          <VoiceSimulatorPanel
            activeSectionId={activeSectionId}
            onClose={() => {
              setShowVoiceSimulator(false);
              if (preSimulatorPresetRef.current) {
                setPreset(preSimulatorPresetRef.current);
                preSimulatorPresetRef.current = null;
              }
            }}
            onSectionChange={setActiveSectionId}
            sections={draft.sections}
          />
        ) : null}
      </div>
      {aiResult ? (
        <AiPreviewDialog
          onAppend={applyPrimaryAssistantResult}
          onClose={closeAiPreview}
          onReplace={aiResult.result.kind === "section" && getAssistantPrimaryApplyMode(aiResult.action, aiResult.result) !== "replace" ? replaceAiResultSection : undefined}
          primaryLabel={getAssistantPrimaryApplyLabel(aiResult.action, aiResult.result)}
          result={aiResult.result}
        />
      ) : null}
      {deleteTalkRequested ? (
        <ConfirmDialog
          body={editor.deleteTalkBody}
          confirm={
            <form action={() => deleteTalk(talk.id)}>
              <Button leftIcon={<Trash2 />} type="submit" variant="primary">{editor.delete}</Button>
            </form>
          }
          onClose={() => setDeleteTalkRequested(false)}
          title={editor.deleteTalkTitle}
        />
      ) : null}
      {sectionToDelete ? (
        <ConfirmDialog
          body={editor.deleteSectionBody.replace("{title}", sectionToDelete.heading || editor.untitled)}
          confirm={
            <Button
              leftIcon={<Trash2 />}
              onClick={() => {
                removeSection(sectionToDelete.id);
                setSectionToDelete(null);
              }}
              type="button"
              variant="primary"
            >
              {editor.delete}
            </Button>
          }
          onClose={() => setSectionToDelete(null)}
          title={editor.deleteSectionTitle}
        />
      ) : null}
    </div>
  );
}

