import type { ProgressionScoreLabel, ProgressionTalkInput, TalkReadiness } from "@/modules/progression/types";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/i18n/routing";
import { estimateTalkDuration } from "./estimate-talk-duration";

const fallbackLocale: Locale = "fr";

export function calculateTalkReadiness(talk: ProgressionTalkInput, locale: Locale = fallbackLocale): TalkReadiness {
  const copy = getMessages(locale).progression;
  const duration = estimateTalkDuration(talk.sections, talk.durationMinutes);
  const hasBrief = talk.sections.some((section) => /^(brief|objectif)/i.test(section.heading.trim()) && section.body.trim());
  const missing: string[] = [];
  let score = 0;

  score += addCriterion(Boolean(talk.title.trim()), 10, copy.missing.title, missing);
  score += addCriterion(Boolean(talk.type), 5, copy.missing.type, missing);
  score += addCriterion(Boolean(talk.audience.trim()), 10, copy.missing.audience, missing);
  score += addCriterion(hasBrief, 10, copy.missing.brief, missing);
  score += addCriterion(talk.durationMinutes > 0, 10, copy.missing.duration, missing);
  score += addCriterion(talk.sections.length >= 3, 15, copy.missing.sections, missing);
  score += addCriterion(talk.sections.length > 0 && talk.sections.every((section) => section.heading.trim()), 10, copy.missing.sectionTitle, missing);
  score += addCriterion(talk.sections.length > 0 && talk.sections.every((section) => section.body.trim()), 15, copy.missing.sectionContent, missing);
  score += addCriterion(duration.status === "good", 10, duration.status === "too_long" ? copy.missing.tooLong : copy.missing.tooShort, missing);
  score += addCriterion(talk.status === "ready", 5, copy.missing.notReady, missing);

  return {
    talk: talk as TalkReadiness["talk"],
    score: Math.min(100, score),
    label: scoreLabel(score, locale),
    missing,
    totalWords: duration.totalWords,
    estimatedMinutes: duration.estimatedMinutes,
    durationStatus: duration.status,
    isArchived: talk.status === "archived",
    isReady: talk.status === "ready" || score >= 80
  };
}

export function scoreLabel(score: number, locale: Locale = fallbackLocale): ProgressionScoreLabel {
  const labels = getMessages(locale).progression.scoreLabels;
  if (score < 40) return labels.structure;
  if (score < 70) return labels.preparing;
  if (score < 90) return labels.almostReady;
  return labels.ready;
}

function addCriterion(complete: boolean, points: number, missingLabel: string, missing: string[]) {
  if (complete) return points;
  missing.push(missingLabel);
  return 0;
}
