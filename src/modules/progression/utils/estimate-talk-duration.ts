import { wordCount } from "@/lib/utils";
import type { DurationStatus, ProgressionSectionInput } from "@/modules/progression/types";

const defaultWordsPerMinute = 140;

export function estimateTalkDuration(sections: ProgressionSectionInput[], targetMinutes: number, wordsPerMinute = defaultWordsPerMinute) {
  const totalWords = sections.reduce((total, section) => total + wordCount(`${section.heading} ${section.body}`), 0);
  const estimatedMinutes = totalWords > 0 ? Math.max(1, Math.round(totalWords / wordsPerMinute)) : 0;
  const safeTarget = Math.max(1, Math.round(targetMinutes || 1));
  const differenceMinutes = estimatedMinutes - safeTarget;
  const allowedDifference = safeTarget * 0.15;
  const status: DurationStatus =
    Math.abs(differenceMinutes) <= allowedDifference ? "good" : differenceMinutes < 0 ? "too_short" : "too_long";

  return {
    totalWords,
    estimatedMinutes,
    targetMinutes: safeTarget,
    differenceMinutes,
    status,
    wordsPerMinute
  };
}
