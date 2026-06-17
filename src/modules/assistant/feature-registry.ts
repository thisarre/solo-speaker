import type { TalkType } from "@/types/talk";
import type { AssistantFeature } from "@/modules/assistant/types";

export type AssistantFeatureDefinition = {
  id: AssistantFeature;
  label: string;
  description: string;
  defaultTalkTypes: TalkType[];
  optionalLabel?: string;
};

export const assistantFeatureDefinitions: AssistantFeatureDefinition[] = [
  {
    id: "outline",
    label: "Générer un plan",
    description: "Créer une structure complète adaptée au type de talk.",
    defaultTalkTypes: ["sermon", "conference", "training", "pitch", "speech"]
  },
  {
    id: "expand-section",
    label: "Développer la section",
    description: "Transformer une idée courte en section exploitable.",
    defaultTalkTypes: ["sermon", "conference", "training", "pitch", "speech"]
  },
  {
    id: "oralize-section",
    label: "Rendre plus oral",
    description: "Rendre le texte plus naturel à dire à voix haute.",
    defaultTalkTypes: ["sermon", "conference", "training", "pitch", "speech"]
  },
  {
    id: "shorten-section",
    label: "Raccourcir",
    description: "Couper sans perdre l'idée principale.",
    defaultTalkTypes: ["sermon", "conference", "training", "pitch", "speech"]
  },
  {
    id: "predict-next",
    label: "Prédiction pendant l'écriture",
    description: "Proposer une suite pendant la rédaction.",
    defaultTalkTypes: ["sermon", "conference", "training", "pitch", "speech"]
  },
  {
    id: "suggest-bible",
    label: "Proposer un verset",
    description: "Suggérer un passage biblique pertinent pour l'idée en cours.",
    defaultTalkTypes: ["sermon"],
    optionalLabel: "Suggestions bibliques"
  }
];

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
  return assistantFeatureDefinitions.some((feature) => feature.id === value);
}

export function getAssistantFeatureDefinition(featureId: AssistantFeature) {
  return assistantFeatureDefinitions.find((feature) => feature.id === featureId);
}

export function getAssistantOptionalFeatures() {
  return assistantFeatureDefinitions.filter((feature) => !isFeatureDefaultForEveryTalkType(feature));
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
