import { talkStatusLabels, type Talk, type TalkStatus } from "@/types/talk";
import type { StatusDistribution } from "@/modules/progression/types";

const statuses: TalkStatus[] = ["draft", "ready", "archived"];

export function calculateStatusDistribution(talks: Pick<Talk, "status">[]): StatusDistribution[] {
  const total = Math.max(1, talks.length);

  return statuses.map((status) => {
    const count = talks.filter((talk) => talk.status === status).length;

    return {
      status,
      label: talkStatusLabels[status],
      count,
      percent: Math.round((count / total) * 100)
    };
  });
}
