import { transcriptTokens } from "./normalize-transcript";
import type { SpeakingIndexItem } from "./speaking-index";

export type TranscriptQuality = {
  commonWordRatio: number;
  isUsable: boolean;
  reason: string;
  repeatedWordRatio: number;
  usefulWordCount: number;
};

export function evaluateTranscriptQuality(input: { indexItems: SpeakingIndexItem[]; transcript: string }): TranscriptQuality {
  const words = transcriptTokens(input.transcript);
  if (words.length < 4) {
    return { commonWordRatio: 0, isUsable: false, reason: "too-short", repeatedWordRatio: 0, usefulWordCount: words.length };
  }

  const talkWords = new Set(input.indexItems.flatMap((item) => item.tokens));
  const commonWords = words.filter((word) => talkWords.has(word));
  const uniqueWords = new Set(words);
  const repeatedWordRatio = 1 - uniqueWords.size / words.length;
  const commonWordRatio = commonWords.length / words.length;

  if (repeatedWordRatio > 0.55) {
    return { commonWordRatio, isUsable: false, reason: "repetition", repeatedWordRatio, usefulWordCount: words.length };
  }

  if (commonWordRatio < 0.2) {
    return { commonWordRatio, isUsable: false, reason: "low-talk-overlap", repeatedWordRatio, usefulWordCount: words.length };
  }

  return { commonWordRatio, isUsable: true, reason: "usable", repeatedWordRatio, usefulWordCount: words.length };
}
