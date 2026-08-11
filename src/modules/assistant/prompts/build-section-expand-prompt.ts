import type { AssistantSectionContext, AssistantTalkContext } from "@/modules/assistant/types";
import { WORDS_PER_MINUTE, talkTypeGuidance } from "@/modules/assistant/prompts/build-talk-outline-prompt";

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
    ...(section.targetDurationMin
      ? [
          `Durée cible de cette section: ${section.targetDurationMin} minute${section.targetDurationMin > 1 ? "s" : ""} à l'oral — vise environ ${section.targetDurationMin * WORDS_PER_MINUTE} mots (±15 %).`
        ]
      : []),
    "Garde un ton naturel, utilisable à l'oral. N'ajoute pas de markdown décoratif."
  ].join("\n");
}
