import { wordCount } from "@/lib/utils";
import { cuePauseSeconds, parseCues } from "./parseCues";
import type { SpeakingItem } from "../types";

const wordsPerSecond = 2.33;

export function estimateTextDuration(text: string) {
  const segments = parseCues(text);
  const spokenText = segments.map((segment) => (segment.kind === "text" ? segment.text : "")).join(" ");
  return Math.ceil(wordCount(spokenText) / wordsPerSecond + cuePauseSeconds(segments));
}

export function estimateDuration(items: SpeakingItem[]) {
  return items.reduce((total, item) => total + item.estimatedSeconds, 0);
}
