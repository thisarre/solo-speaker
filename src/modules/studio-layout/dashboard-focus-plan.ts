import type { Talk } from "@/types/talk";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/i18n/routing";

export type DashboardFocusPlan = {
  label: string;
  title: string;
  description: string;
  href: string;
  status: string;
  progress: number;
};

function readinessPercent(talk: Talk) {
  const sectionScore = Math.min(1, talk.sections.length / 4) * 44;
  const audienceScore = talk.audience.trim() ? 18 : 0;
  const durationScore = talk.durationMinutes > 0 ? 14 : 0;
  const statusScore = talk.status === "ready" ? 24 : 0;
  return Math.max(10, Math.min(100, Math.round(sectionScore + audienceScore + durationScore + statusScore)));
}

const fallbackLocale: Locale = "fr";

export function buildDashboardFocusPlan(talks: Talk[], locale: Locale = fallbackLocale): DashboardFocusPlan {
  const copy = getMessages(locale).dashboard.focusPlan;
  const activeTalks = talks.filter((talk) => talk.status !== "archived");
  const draftToFinish = activeTalks
    .filter((talk) => talk.status === "draft")
    .sort((a, b) => readinessPercent(a) - readinessPercent(b))[0];

  if (!activeTalks.length) {
    return {
      label: copy.start[0],
      title: copy.start[1],
      description: copy.start[2],
      href: "/talks/new?guided=1",
      status: copy.start[3],
      progress: 0
    };
  }

  if (draftToFinish) {
    const title = draftToFinish.title || copy.focus[4];
    return {
      label: copy.focus[0],
      title: copy.focus[1].replace("{title}", title),
      description: copy.focus[2],
      href: `/talks/${draftToFinish.id}`,
      status: copy.focus[3],
      progress: readinessPercent(draftToFinish)
    };
  }

  const readyTalk = activeTalks.find((talk) => talk.status === "ready") ?? activeTalks[0];

  const title = readyTalk.title || copy.rehearse[4];
  return {
    label: copy.rehearse[0],
    title: copy.rehearse[1].replace("{title}", title),
    description: copy.rehearse[2],
    href: `/talks/${readyTalk.id}/speak`,
    status: copy.rehearse[3],
    progress: readinessPercent(readyTalk)
  };
}
