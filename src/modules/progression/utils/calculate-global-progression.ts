import type { GlobalProgressionReport, ProgressionTalkInput } from "@/modules/progression/types";
import { buildGlobalRecommendations } from "./build-global-recommendations";
import { calculateStatusDistribution } from "./calculate-status-distribution";
import { calculateTalkReadiness, scoreLabel } from "./calculate-talk-readiness";
import { calculateTypeDistribution } from "./calculate-type-distribution";

export function calculateGlobalProgression(talks: ProgressionTalkInput[]): GlobalProgressionReport {
  const readiness = talks.map(calculateTalkReadiness);
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
    label: scoreLabel(score),
    activeTalks,
    readyTalks,
    draftTalks,
    archivedTalks,
    totalPreparedMinutes,
    totalSections,
    metrics: [
      { id: "active", label: "Talks actifs", value: activeTalks, detail: `${talks.length} au total` },
      { id: "ready", label: "Prêts", value: readyTalks, detail: `${draftTalks} brouillon${draftTalks > 1 ? "s" : ""}` },
      { id: "minutes", label: "Temps préparé", value: `${totalPreparedMinutes} min`, detail: "Hors archives" },
      { id: "sections", label: "Sections", value: totalSections, detail: "Dans les talks actifs" }
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
    recommendations: buildGlobalRecommendations(readiness)
  };
}
