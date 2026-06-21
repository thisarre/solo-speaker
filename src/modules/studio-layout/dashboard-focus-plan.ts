import type { Talk } from "@/types/talk";

export type DashboardFocusPlan = {
  label: "Démarrage" | "Focus" | "Répétition";
  title: string;
  description: string;
  href: string;
  status: "À lancer" | "À clarifier" | "Prêt";
  progress: number;
};

function readinessPercent(talk: Talk) {
  const sectionScore = Math.min(1, talk.sections.length / 4) * 44;
  const audienceScore = talk.audience.trim() ? 18 : 0;
  const durationScore = talk.durationMinutes > 0 ? 14 : 0;
  const statusScore = talk.status === "ready" ? 24 : 0;
  return Math.max(10, Math.min(100, Math.round(sectionScore + audienceScore + durationScore + statusScore)));
}

export function buildDashboardFocusPlan(talks: Talk[]): DashboardFocusPlan {
  const activeTalks = talks.filter((talk) => talk.status !== "archived");
  const draftToFinish = activeTalks
    .filter((talk) => talk.status === "draft")
    .sort((a, b) => readinessPercent(a) - readinessPercent(b))[0];

  if (!activeTalks.length) {
    return {
      label: "Démarrage",
      title: "Créer le premier talk",
      description: "Lancez un brouillon guidé pour transformer l'idée en plan présentable.",
      href: "/talks/new?guided=1",
      status: "À lancer",
      progress: 0
    };
  }

  if (draftToFinish) {
    return {
      label: "Focus",
      title: `Finaliser ${draftToFinish.title || "le talk en cours"}`,
      description: "Complétez l'audience, la durée et les sections avant de passer en répétition.",
      href: `/talks/${draftToFinish.id}`,
      status: "À clarifier",
      progress: readinessPercent(draftToFinish)
    };
  }

  const readyTalk = activeTalks.find((talk) => talk.status === "ready") ?? activeTalks[0];

  return {
    label: "Répétition",
    title: `Répéter ${readyTalk.title || "le prochain talk"}`,
    description: "Passez en mode speaking pour vérifier le rythme, les transitions et le temps réel.",
    href: `/talks/${readyTalk.id}/speak`,
    status: "Prêt",
    progress: readinessPercent(readyTalk)
  };
}
