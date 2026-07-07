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
    `Adapte le nombre de sections à la durée (environ 1 section par 5 à 10 minutes, soit entre ${Math.max(1, Math.floor(talk.targetDurationMin / 10))} et ${Math.max(2, Math.ceil(talk.targetDurationMin / 5))} sections).`,
    "Renseigne pour chaque section le champ targetDurationMin : sa durée cible en minutes (nombre entier ≥ 1).",
    "La somme des targetDurationMin doit être égale à la durée cible totale à ±10 %.",
    "N'écris jamais la durée dans le titre d'une section.",
    "Retourne uniquement des sections courtes, prêtes à être modifiées dans un éditeur.",
    "Chaque section doit contenir un titre et un brouillon oral de 2 à 5 phrases.",
    "N'ajoute pas de markdown décoratif."
  ].join("\n");
}
