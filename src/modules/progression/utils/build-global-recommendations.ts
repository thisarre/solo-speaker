import type { ProgressionRecommendation, TalkReadiness } from "@/modules/progression/types";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/i18n/routing";

const fallbackLocale: Locale = "fr";

export function buildGlobalRecommendations(readiness: TalkReadiness[], locale: Locale = fallbackLocale): ProgressionRecommendation[] {
  const copy = getMessages(locale).progression.recommendationCopy;
  const active = readiness.filter((item) => !item.isArchived);
  const recommendations: ProgressionRecommendation[] = [];

  if (active.some((item) => !item.talk.audience.trim())) {
    recommendations.push({
      id: "missing-audience",
      message: copy.missingAudience[0],
      actionLabel: copy.missingAudience[1],
      href: "/talks"
    });
  }

  if (active.some((item) => item.talk.sections.length < 3)) {
    recommendations.push({
      id: "missing-sections",
      message: copy.missingSections[0],
      actionLabel: copy.missingSections[1],
      href: "/talks"
    });
  }

  const ready = active.find((item) => item.isReady);
  if (ready) {
    recommendations.push({
      id: "practice-ready",
      message: copy.practiceReady[0],
      actionLabel: copy.practiceReady[1],
      href: `/talks/${ready.talk.id}/speak`
    });
  }

  if (readiness.some((item) => item.isArchived)) {
    recommendations.push({
      id: "review-archives",
      message: copy.reviewArchives[0],
      actionLabel: copy.reviewArchives[1],
      href: "/talks"
    });
  }

  const tooLong = active.find((item) => item.durationStatus === "too_long");
  if (tooLong) {
    recommendations.push({
      id: "shorten-long-talks",
      message: copy.shortenLongTalks[0],
      actionLabel: copy.shortenLongTalks[1],
      href: `/talks/${tooLong.talk.id}`
    });
  }

  if (!recommendations.length) {
    recommendations.push({
      id: "create-talk",
      message: copy.createTalk[0],
      actionLabel: copy.createTalk[1],
      href: "/talks/new"
    });
  }

  return recommendations.slice(0, 5);
}
