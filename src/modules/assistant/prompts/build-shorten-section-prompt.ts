import type { AssistantSectionContext, AssistantTalkContext } from "@/modules/assistant/types";
import { talkTypeGuidance } from "@/modules/assistant/prompts/build-talk-outline-prompt";
import { wordCount } from "@/lib/utils";

export function getShortenTargetWordCount(currentWords: number) {
  if (currentWords <= 0) return 0;
  if (currentWords < 40) return Math.max(8, Math.round(currentWords * 0.8));
  return Math.max(30, Math.round(currentWords * 0.6));
}

export function buildShortenSectionPrompt(talk: AssistantTalkContext, section: AssistantSectionContext) {
  const currentWords = wordCount(section.body);
  const targetWords = getShortenTargetWordCount(currentWords);

  return [
    "Tu raccourcis une section de talk pour tenir dans une durée plus courte.",
    `Langue: ${talk.language === "FR" ? "français" : "anglais"}.`,
    `Type de talk: ${talk.type}. ${talkTypeGuidance[talk.type]}`,
    `Titre du talk: ${talk.title || "Sans titre"}.`,
    `Durée cible totale du talk: ${talk.targetDurationMin} minutes.`,
    `Section: ${section.heading || "Sans titre"}.`,
    `Texte actuel: ${currentWords} mots.`,
    `Maximum vise: ${targetWords} mots.`,
    "Le resultat doit etre nettement plus court: supprimer au moins 40 pour cent si le texte le permet.",
    "Ne conserve que l'idee centrale, les phrases fortes, une transition utile et une conclusion claire.",
    "Retourne uniquement la section raccourcie, sans commentaire ni explication.",
    "Texte a raccourcir:",
    section.body || "(section vide)",
    "N'ajoute pas de markdown décoratif."
  ].join("\n");
}
