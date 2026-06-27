import type { TalkType } from "@/types/talk";
import type { AssistantFeature } from "@/modules/assistant/types";
import { getMessages } from "@/i18n/messages";
import { defaultLocale, type Locale } from "@/i18n/routing";

export type AssistantFeatureDefinition = {
  id: AssistantFeature;
  label: string;
  description: string;
  defaultTalkTypes: TalkType[];
  optionalLabel?: string;
};

const featureIds: AssistantFeature[] = ["outline", "expand-section", "oralize-section", "shorten-section", "predict-next", "suggest-bible"];

const defaultAssistantFeaturesByFeature: Record<AssistantFeature, TalkType[]> = {
  outline: ["sermon", "conference", "training", "pitch", "speech"],
  "expand-section": ["sermon", "conference", "training", "pitch", "speech"],
  "oralize-section": ["sermon", "conference", "training", "pitch", "speech"],
  "shorten-section": ["sermon", "conference", "training", "pitch", "speech"],
  "predict-next": ["sermon", "conference", "training", "pitch", "speech"],
  "suggest-bible": ["sermon"]
};

export function getAssistantFeatureDefinitions(locale: Locale = defaultLocale): AssistantFeatureDefinition[] {
  const copy = getMessages(locale).assistant.features;

  return featureIds.map((id) => ({
    id,
    label: copy[id][0],
    description: copy[id][1],
    defaultTalkTypes: defaultAssistantFeaturesByFeature[id],
    optionalLabel: copy[id][2]
  }));
}

export const assistantFeatureDefinitions: AssistantFeatureDefinition[] = getAssistantFeatureDefinitions(defaultLocale);

export const defaultAssistantFeaturesByTalkType: Record<TalkType, AssistantFeature[]> = {
  sermon: ["outline", "expand-section", "oralize-section", "shorten-section", "predict-next", "suggest-bible"],
  conference: ["outline", "expand-section", "oralize-section", "shorten-section", "predict-next"],
  training: ["outline", "expand-section", "oralize-section", "shorten-section", "predict-next"],
  pitch: ["outline", "expand-section", "oralize-section", "shorten-section", "predict-next"],
  speech: ["outline", "expand-section", "oralize-section", "shorten-section", "predict-next"]
};

export type AssistantFeatureSettings = {
  extraEnabledFeatures: AssistantFeature[];
};

export const defaultAssistantFeatureSettings: AssistantFeatureSettings = {
  extraEnabledFeatures: []
};

export function isAssistantFeature(value: string): value is AssistantFeature {
  return featureIds.some((feature) => feature === value);
}

export function getAssistantFeatureDefinition(featureId: AssistantFeature, locale: Locale = defaultLocale) {
  return getAssistantFeatureDefinitions(locale).find((feature) => feature.id === featureId);
}

export function getAssistantOptionalFeatures(locale: Locale = defaultLocale) {
  return getAssistantFeatureDefinitions(locale).filter((feature) => !isFeatureDefaultForEveryTalkType(feature));
}

export function getEnabledAssistantFeatures(talkType: TalkType, settings: AssistantFeatureSettings = defaultAssistantFeatureSettings) {
  const enabled = new Set<AssistantFeature>(defaultAssistantFeaturesByTalkType[talkType]);
  settings.extraEnabledFeatures.forEach((feature) => enabled.add(feature));
  return enabled;
}

export function isAssistantFeatureEnabled(featureId: AssistantFeature, talkType: TalkType, settings: AssistantFeatureSettings = defaultAssistantFeatureSettings) {
  return getEnabledAssistantFeatures(talkType, settings).has(featureId);
}

function isFeatureDefaultForEveryTalkType(feature: AssistantFeatureDefinition) {
  return feature.defaultTalkTypes.length === Object.keys(defaultAssistantFeaturesByTalkType).length;
}
