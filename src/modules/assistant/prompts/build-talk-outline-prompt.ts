import type { AssistantTalkContext } from "@/modules/assistant/types";
import type { TalkType } from "@/types/talk";

export const talkTypeGuidance: Record<TalkType, string> = {
  sermon: "Structure pastorale avec accroche, texte ou idée centrale, tension humaine, exposition claire, application concrète et appel final.",
  conference: "Structure de conférence avec angle fort, problème, idée directrice, preuves, exemples et conclusion mémorable.",
  training: "Structure pédagogique avec objectif d'apprentissage, étapes progressives, exercices ou mises en situation, récapitulatif actionnable.",
  pitch: "Structure concise avec problème, solution, différenciation, preuve, modèle ou bénéfice, demande claire.",
  speech: "Structure de discours avec présence orale, progression émotionnelle, images simples, moments de respiration et chute nette."
};

export function buildTalkOutlinePrompt(talk: AssistantTalkContext) {
  return [
    "Tu aides à préparer un talk oral. Génère un plan directement exploitable.",
    `Langue: ${talk.language === "FR" ? "français" : "anglais"}.`,
    `Type: ${talk.type}. ${talkTypeGuidance[talk.type]}`,
    `Titre: ${talk.title || "Sans titre"}.`,
    `Audience: ${talk.audience || "Non précisée"}.`,
    `Objectif: ${talk.objective || "Clarifier et rendre le message utile pour l'audience"}.`,
    `Durée cible: ${talk.targetDurationMin} minutes.`,
    "Retourne uniquement des sections courtes, prêtes à être modifiées dans un éditeur.",
    "Chaque section doit contenir un titre et un brouillon oral de 2 à 5 phrases.",
    "N'ajoute pas de markdown décoratif."
  ].join("\n");
}
