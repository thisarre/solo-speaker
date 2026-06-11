import type { AssistantSectionContext, AssistantTalkContext } from "@/modules/assistant/types";
import { talkTypeGuidance } from "@/modules/assistant/prompts/build-talk-outline-prompt";

export function buildShortenSectionPrompt(talk: AssistantTalkContext, section: AssistantSectionContext) {
  return [
    "Tu raccourcis une section de talk pour tenir dans une durée plus courte.",
    `Langue: ${talk.language === "FR" ? "français" : "anglais"}.`,
    `Type de talk: ${talk.type}. ${talkTypeGuidance[talk.type]}`,
    `Titre du talk: ${talk.title || "Sans titre"}.`,
    `Durée cible totale du talk: ${talk.targetDurationMin} minutes.`,
    `Section: ${section.heading || "Sans titre"}.`,
    "Texte actuel:",
    section.body || "(section vide)",
    "Réduis le texte d'environ 35 à 45 pour cent en gardant l'idée centrale, les formulations fortes et une conclusion claire.",
    "N'ajoute pas de markdown décoratif."
  ].join("\n");
}
