import type { GlobalProgressionReport, ProgressionTalkInput } from "@/modules/progression/types";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/i18n/routing";
import { buildGlobalRecommendations } from "./build-global-recommendations";
import { calculateStatusDistribution } from "./calculate-status-distribution";
import { calculateTalkReadiness, scoreLabel } from "./calculate-talk-readiness";
import { calculateTypeDistribution } from "./calculate-type-distribution";

function formatCount(template: string, count: number) {
  return template.replace("{count}", String(count)).replace("{plural}", count > 1 ? "s" : "");
}

const fallbackLocale: Locale = "fr";

export function calculateGlobalProgression(talks: ProgressionTalkInput[], locale: Locale = fallbackLocale): GlobalProgressionReport {
  const copy = getMessages(locale).progression;
  const readiness = talks.map((talk) => calculateTalkReadiness(talk, locale));
  const activeReadiness = readiness.filter((item) => !item.isArchived);
  const activeTalks = activeReadiness.length;
  const readyTalks = readiness.filter((item) => item.talk.status === "ready").length;
  const draftTalks = readiness.filter((item) => item.talk.status === "draft").length;
  const archivedTalks = readiness.filter((item) => item.talk.status === "archived").length;
  const totalPreparedMinutes = activeReadiness.reduce((total, item) => total + item.estimatedMinutes, 0);
  const totalSections = activeReadiness.reduce((total, item) => total + item.talk.sections.length, 0);
  const score = activeReadiness.length
    ? Math.round(activeReadiness.reduce((total, item) => total + item.score, 0) / activeReadiness.length)
    : 0;

  return {
    score,
    label: scoreLabel(score, locale),
    activeTalks,
    readyTalks,
    draftTalks,
    archivedTalks,
    totalPreparedMinutes,
    totalSections,
    metrics: [
      { id: "active", label: copy.metrics.active, value: activeTalks, detail: copy.metrics.total.replace("{count}", String(talks.length)) },
      { id: "ready", label: copy.metrics.ready, value: readyTalks, detail: formatCount(copy.metrics.drafts, draftTalks) },
      { id: "minutes", label: copy.metrics.minutes, value: `${totalPreparedMinutes} min`, detail: copy.metrics.outsideArchives },
      { id: "sections", label: copy.metrics.sections, value: totalSections, detail: copy.metrics.activeTalks }
    ],
    readiness,
    toFinish: activeReadiness
      .filter((item) => item.talk.status === "draft" || item.score < 80)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5),
    readyToPresent: activeReadiness
      .filter((item) => item.talk.status === "ready" || item.score >= 80)
      .slice(0, 5),
    statusDistribution: calculateStatusDistribution(talks),
    typeDistribution: calculateTypeDistribution(talks),
    recommendations: buildGlobalRecommendations(readiness, locale)
  };
}
