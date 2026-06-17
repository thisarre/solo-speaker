import type { AssistantSectionContext, AssistantTalkContext } from "@/modules/assistant/types";
import { talkTypeGuidance } from "@/modules/assistant/prompts/build-talk-outline-prompt";

export function buildPredictNextPrompt(talk: AssistantTalkContext, section: AssistantSectionContext) {
  return [
    "Tu aides à continuer un texte en respectant strictement le style déjà écrit.",
    `Langue: ${talk.language === "FR" ? "français" : "anglais"}.`,
    `Type de talk: ${talk.type}. ${talkTypeGuidance[talk.type]}`,
    `Titre du talk: ${talk.title || "Sans titre"}.`,
    `Audience: ${talk.audience || "Non précisée"}.`,
    `Section: ${section.heading || "Sans titre"}.`,
    "Texte déjà écrit, à utiliser comme échantillon de style:",
    section.body || "(section vide)",
    "Propose uniquement la suite immédiate, en 1 à 2 phrases maximum.",
    "Ne répète pas le texte existant. N'ajoute pas de titre, de markdown, ni de commentaire."
  ].join("\n");
}
