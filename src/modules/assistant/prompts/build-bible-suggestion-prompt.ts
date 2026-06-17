import type { AssistantSectionContext, AssistantTalkContext } from "@/modules/assistant/types";

export function buildBibleSuggestionPrompt(talk: AssistantTalkContext, section: AssistantSectionContext) {
  return [
    "Tu aides une personne à trouver un verset biblique pertinent pour sa prise de parole.",
    `Langue de réponse: ${talk.language === "FR" ? "français" : "anglais"}.`,
    `Type de talk: ${talk.type}.`,
    `Titre: ${talk.title || "Sans titre"}.`,
    `Audience: ${talk.audience || "Non précisée"}.`,
    `Objectif: ${talk.objective || "Non précisé"}.`,
    `Section: ${section.heading || "Sans titre"}.`,
    "Texte saisi:",
    section.body || "(section vide)",
    "Détecte d'abord si la dernière phrase ressemble à une phrase biblique connue.",
    "Si ce n'est pas le cas, détecte le sujet biblique rejoint par le texte: pardon, foi, peur, grâce, repentance, espérance, service, amour, sagesse, souffrance, appel, etc.",
    "Propose un seul verset lié à cette phrase ou à ce sujet.",
    "Utilise une référence biblique précise. Cite le verset de façon concise, sans inventer une traduction inconnue.",
    "Explique en une phrase pourquoi ce verset est pertinent pour cette section."
  ].join("\n");
}
