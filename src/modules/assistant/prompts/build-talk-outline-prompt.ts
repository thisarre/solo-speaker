import type { AssistantTalkContext } from "@/modules/assistant/types";
import type { TalkType } from "@/types/talk";

// Aligné sur la cadence de parole utilisée par l'estimation de durée
// (src/modules/progression/utils/estimate-talk-duration.ts). Le plan doit produire
// assez de matière pour que la durée estimée corresponde vraiment à la cible.
// Constante partagée pour que génération et estimation ne divergent jamais.
export const WORDS_PER_MINUTE = 140;

export const talkTypeGuidance: Record<TalkType, string> = {
  sermon: "Structure pastorale avec accroche, texte ou idée centrale, tension humaine, exposition claire, application concrète et appel final.",
  conference: "Structure de conférence avec angle fort, problème, idée directrice, preuves, exemples et conclusion mémorable.",
  training: "Structure pédagogique avec objectif d'apprentissage, étapes progressives, exercices ou mises en situation, récapitulatif actionnable.",
  pitch: "Structure concise avec problème, solution, différenciation, preuve, modèle ou bénéfice, demande claire.",
  speech: "Structure de discours avec présence orale, progression émotionnelle, images simples, moments de respiration et chute nette."
};

export function buildTalkOutlinePrompt(talk: AssistantTalkContext) {
  const minSections = Math.max(1, Math.floor(talk.targetDurationMin / 10));
  const maxSections = Math.max(2, Math.ceil(talk.targetDurationMin / 5));
  const totalWords = talk.targetDurationMin * WORDS_PER_MINUTE;

  return [
    "Tu aides à préparer un talk oral. Génère un plan directement exploitable.",
    `Langue: ${talk.language === "FR" ? "français" : "anglais"}.`,
    `Type: ${talk.type}. ${talkTypeGuidance[talk.type]}`,
    `Titre: ${talk.title || "Sans titre"}.`,
    `Audience: ${talk.audience || "Non précisée"}.`,
    `Objectif: ${talk.objective || "Clarifier et rendre le message utile pour l'audience"}.`,
    `Durée cible: ${talk.targetDurationMin} minutes.`,
    `Adapte le nombre de sections à la durée (environ 1 section par 5 à 10 minutes, soit entre ${minSections} et ${maxSections} sections).`,
    "Renseigne pour chaque section le champ targetDurationMin : sa durée cible en minutes (nombre entier ≥ 1).",
    "La somme des targetDurationMin doit être égale à la durée cible totale à ±10 %.",
    "N'écris jamais la durée dans le titre d'une section.",
    `Cadence de parole visée : environ ${WORDS_PER_MINUTE} mots par minute.`,
    `Le champ body de chaque section est un brouillon oral dont la longueur est proportionnelle à son targetDurationMin (environ ${WORDS_PER_MINUTE} mots par minute de section).`,
    `La longueur totale de tous les brouillons doit avoisiner ${totalWords} mots (±15 %) pour couvrir réellement la durée cible de ${talk.targetDurationMin} minutes.`,
    "Écris un texte prêt à être lu à voix haute, naturel à l'oral et modifiable dans un éditeur, pas un simple squelette de puces.",
    "N'ajoute pas de markdown décoratif."
  ].join("\n");
}
