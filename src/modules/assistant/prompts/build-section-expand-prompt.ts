import type { AssistantSectionContext, AssistantTalkContext } from "@/modules/assistant/types";
import { talkTypeGuidance } from "@/modules/assistant/prompts/build-talk-outline-prompt";

export function buildSectionExpandPrompt(talk: AssistantTalkContext, section: AssistantSectionContext) {
  return [
    "Tu aides à développer une section de talk sans changer son intention.",
    `Langue: ${talk.language === "FR" ? "français" : "anglais"}.`,
    `Type de talk: ${talk.type}. ${talkTypeGuidance[talk.type]}`,
    `Titre du talk: ${talk.title || "Sans titre"}.`,
    `Audience: ${talk.audience || "Non précisée"}.`,
    `Objectif: ${talk.objective || "Non précisé"}.`,
    `Section: ${section.heading || "Sans titre"}.`,
    "Texte actuel:",
    section.body || "(section vide)",
    "Développe cette section avec une progression claire, des transitions orales et un exemple concret si utile.",
    "Garde un ton naturel, utilisable à l'oral. N'ajoute pas de markdown décoratif."
  ].join("\n");
}
