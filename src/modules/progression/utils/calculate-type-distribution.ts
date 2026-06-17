import { talkTypeLabels, type Talk, type TalkType } from "@/types/talk";
import type { TypeDistribution } from "@/modules/progression/types";

const types: TalkType[] = ["sermon", "conference", "training", "pitch", "speech"];

export function calculateTypeDistribution(talks: Pick<Talk, "type">[]): TypeDistribution[] {
  const total = Math.max(1, talks.length);

  return types.map((type) => {
    const count = talks.filter((talk) => talk.type === type).length;

    return {
      type,
      label: talkTypeLabels[type],
      count,
      percent: Math.round((count / total) * 100)
    };
  });
}
