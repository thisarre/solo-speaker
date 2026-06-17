import type { ProgressionRecommendation, TalkReadiness } from "@/modules/progression/types";

export function buildGlobalRecommendations(readiness: TalkReadiness[]): ProgressionRecommendation[] {
  const active = readiness.filter((item) => !item.isArchived);
  const recommendations: ProgressionRecommendation[] = [];

  if (active.some((item) => !item.talk.audience.trim())) {
    recommendations.push({
      id: "missing-audience",
      message: "Ajoute une audience aux Talks qui n'en ont pas.",
      actionLabel: "Voir les talks",
      href: "/talks"
    });
  }

  if (active.some((item) => item.talk.sections.length < 3)) {
    recommendations.push({
      id: "missing-sections",
      message: "Finalise les Talks avec moins de 3 sections.",
      actionLabel: "Structurer",
      href: "/talks"
    });
  }

  const ready = active.find((item) => item.isReady);
  if (ready) {
    recommendations.push({
      id: "practice-ready",
      message: "Passe en Speaking Mode sur les Talks prêts.",
      actionLabel: "Présenter",
      href: `/talks/${ready.talk.id}/speak`
    });
  }

  if (readiness.some((item) => item.isArchived)) {
    recommendations.push({
      id: "review-archives",
      message: "Garde les Talks terminés archivés pour clarifier ta préparation active.",
      actionLabel: "Voir",
      href: "/talks"
    });
  }

  const tooLong = active.find((item) => item.durationStatus === "too_long");
  if (tooLong) {
    recommendations.push({
      id: "shorten-long-talks",
      message: "Raccourcis les Talks qui dépassent fortement leur durée cible.",
      actionLabel: "Éditer",
      href: `/talks/${tooLong.talk.id}`
    });
  }

  if (!recommendations.length) {
    recommendations.push({
      id: "create-talk",
      message: "Crée un nouveau Talk pour commencer une préparation.",
      actionLabel: "Nouveau talk",
      href: "/talks/new"
    });
  }

  return recommendations.slice(0, 5);
}
