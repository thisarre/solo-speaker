"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { getAssistantFeatureDefinitions, getEnabledAssistantFeatures } from "@/modules/assistant/feature-registry";
import { useAssistantFeatureSettings } from "@/modules/assistant/feature-settings";
import { getOnboardingAssistantFeatureSettings, type GuidedTalkSuggestion } from "@/modules/onboarding/personalization";
import { createTalk } from "@/modules/talks/actions";
import { VoiceMemoRecorder } from "@/modules/voice-memo/components/voice-memo-recorder";
import { voiceMemoLanguageForLocale } from "@/modules/voice-memo/language";
import { useI18n } from "@/i18n/client";
import { localizedPath } from "@/i18n/routing";
import type { TalkType } from "@/types/talk";

const talkTypes: TalkType[] = ["sermon", "conference", "training", "pitch", "speech"];

type NewTalkFormProps = {
  error?: string;
  guide?: GuidedTalkSuggestion;
};

export function NewTalkForm({ error, guide }: NewTalkFormProps) {
  const { locale, messages } = useI18n();
  const talks = messages.talks;
  const assistantFeatureDefinitions = getAssistantFeatureDefinitions(locale);
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [clientError, setClientError] = useState("");
  const [selectedType, setSelectedType] = useState<TalkType>(guide?.type ?? "conference");
  const { settings } = useAssistantFeatureSettings();
  const onboardingSettings = getOnboardingAssistantFeatureSettings(
    guide ? {
      speaker_role: "speaker",
      primary_talk_type: guide.type,
      onboarding_help_requested: false,
      onboarding_support_note: ""
    } : null
  );
  const enabledFeatures = getEnabledAssistantFeatures(selectedType, {
    extraEnabledFeatures: Array.from(new Set([...settings.extraEnabledFeatures, ...onboardingSettings.extraEnabledFeatures]))
  });

  return (
    <form
      action={createTalk}
      className="grid gap-3.5"
      noValidate
      onSubmit={(event) => {
        if (!title.trim()) {
          event.preventDefault();
          setClientError(talks.missingTitle);
        }
      }}
    >
      {error || clientError ? (
        <Alert>{clientError || error}</Alert>
      ) : null}

      <Input
        id="title"
        label={talks.titleLabel}
        name="title"
        onChange={(event) => {
          setTitle(event.target.value);
          if (clientError) setClientError("");
        }}
        placeholder={guide?.titlePlaceholder ?? talks.titlePlaceholder}
        required
        value={title}
      />
      <Input id="audience" label={talks.audienceLabel} name="audience" placeholder={talks.audiencePlaceholder} />
      <div>
        <p className="mb-2 text-xs font-[550] text-muted">{talks.typeLabel}</p>
        <div className="flex flex-wrap gap-1.5">
          {talkTypes.map((type) => (
            <label className="cursor-pointer" key={type}>
              <input
                checked={selectedType === type}
                className="peer sr-only"
                name="type"
                onChange={() => setSelectedType(type)}
                type="radio"
                value={type}
              />
              <span className="studio-chip studio-chip-choice inline-flex h-8 items-center rounded-[8px] border border-border bg-surface px-3 font-[550] text-muted shadow-[0_1px_2px_rgba(20,20,25,.02)] transition hover:text-foreground">
                {talks.types[type]}
              </span>
            </label>
          ))}
        </div>
        <div className="mt-3 rounded-[10px] border border-border bg-panel p-3">
          <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">{talks.activeModules}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Array.from(enabledFeatures).map((featureId) => {
              const feature = assistantFeatureDefinitions.find((item) => item.id === featureId);
              return feature ? (
                <span className="rounded-[7px] border border-border bg-surface px-2 py-1 text-[11.5px] font-[550] text-muted" key={feature.id}>
                  {feature.optionalLabel ?? feature.label}
                </span>
              ) : null;
            })}
          </div>
        </div>
      </div>
      <Textarea
        id="brief"
        label={talks.briefLabel}
        name="brief"
        onChange={(event) => setBrief(event.target.value)}
        placeholder={guide?.briefPlaceholder ?? talks.briefPlaceholder}
        value={brief}
      />
      <VoiceMemoRecorder
        language={voiceMemoLanguageForLocale(locale)}
        onInsert={(text) => {
          setBrief((current) => {
            const separator = current.trim() ? "\n\n" : "";
            return `${current}${separator}${text}`.trimStart();
          });
        }}
      />
      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <Link href={localizedPath("/talks", locale)}>
          <Button variant="ghost">{talks.cancel}</Button>
        </Link>
        <SubmitButton creatingLabel={talks.creating} idleLabel={talks.createDraft} />
      </div>
    </form>
  );
}

function SubmitButton({ creatingLabel, idleLabel }: { creatingLabel: string; idleLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} leftIcon={pending ? <Loader2 className="animate-spin" /> : undefined} type="submit" variant="primary">
      {pending ? creatingLabel : idleLabel}
    </Button>
  );
}
