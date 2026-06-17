import type { ProgressionScoreLabel, ProgressionTalkInput, TalkReadiness } from "@/modules/progression/types";
import { estimateTalkDuration } from "./estimate-talk-duration";

export function calculateTalkReadiness(talk: ProgressionTalkInput): TalkReadiness {
  const duration = estimateTalkDuration(talk.sections, talk.durationMinutes);
  const hasBrief = talk.sections.some((section) => /^(brief|objectif)/i.test(section.heading.trim()) && section.body.trim());
  const missing: string[] = [];
  let score = 0;

  score += addCriterion(Boolean(talk.title.trim()), 10, "Titre manquant", missing);
  score += addCriterion(Boolean(talk.type), 5, "Type manquant", missing);
  score += addCriterion(Boolean(talk.audience.trim()), 10, "Audience manquante", missing);
  score += addCriterion(hasBrief, 10, "Objectif ou brief manquant", missing);
  score += addCriterion(talk.durationMinutes > 0, 10, "Durée cible manquante", missing);
  score += addCriterion(talk.sections.length >= 3, 15, "Moins de 3 sections", missing);
  score += addCriterion(talk.sections.length > 0 && talk.sections.every((section) => section.heading.trim()), 10, "Titre de section manquant", missing);
  score += addCriterion(talk.sections.length > 0 && talk.sections.every((section) => section.body.trim()), 15, "Contenu de section manquant", missing);
  score += addCriterion(duration.status === "good", 10, duration.status === "too_long" ? "Talk trop long" : "Talk trop court", missing);
  score += addCriterion(talk.status === "ready", 5, "Statut pas encore prêt", missing);

  return {
    talk: talk as TalkReadiness["talk"],
    score: Math.min(100, score),
    label: scoreLabel(score),
    missing,
    totalWords: duration.totalWords,
    estimatedMinutes: duration.estimatedMinutes,
    durationStatus: duration.status,
    isArchived: talk.status === "archived",
    isReady: talk.status === "ready" || score >= 80
  };
}

export function scoreLabel(score: number): ProgressionScoreLabel {
  if (score < 40) return "À structurer";
  if (score < 70) return "En préparation";
  if (score < 90) return "Presque prêt";
  return "Prêt à présenter";
}

function addCriterion(complete: boolean, points: number, missingLabel: string, missing: string[]) {
  if (complete) return points;
  missing.push(missingLabel);
  return 0;
}
