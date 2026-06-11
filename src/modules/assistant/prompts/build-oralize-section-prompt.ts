import type { AssistantSectionContext, AssistantTalkContext } from "@/modules/assistant/types";
import { talkTypeGuidance } from "@/modules/assistant/prompts/build-talk-outline-prompt";

export function buildOralizeSectionPrompt(talk: AssistantTalkContext, section: AssistantSectionContext) {
  return [
    "Tu réécris une section pour qu'elle sonne plus orale, plus naturelle et plus facile à dire.",
    `Langue: ${talk.language === "FR" ? "français" : "anglais"}.`,
    `Type de talk: ${talk.type}. ${talkTypeGuidance[talk.type]}`,
    `Titre du talk: ${talk.title || "Sans titre"}.`,
    `Audience: ${talk.audience || "Non précisée"}.`,
    `Section: ${section.heading || "Sans titre"}.`,
    "Texte actuel:",
    section.body || "(section vide)",
    "Réécris avec des phrases plus respirables, des transitions simples et un rythme de parole naturel.",
    "Préserve le fond. N'ajoute pas de markdown décoratif."
  ].join("\n");
}
