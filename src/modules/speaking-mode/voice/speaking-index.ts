import type { SpeakingItem } from "@/modules/speaking-mode/types";
import { normalizeTranscript, transcriptTokens } from "./normalize-transcript";
import type { TalkVocabulary } from "./talk-vocabulary";

export type SpeakingIndexItem = {
  endWordApprox: number;
  id: string;
  index: number;
  keywords: string[];
  kind?: SpeakingItem["kind"];
  normalizedText: string;
  originalText: string;
  phraseNgrams: string[];
  sectionId: string;
  startWordApprox: number;
  text: string;
  tokens: string[];
};

function ngrams(tokens: string[], min = 2, max = 3) {
  const values: string[] = [];
  for (let size = min; size <= max; size += 1) {
    for (let index = 0; index <= tokens.length - size; index += 1) {
      values.push(tokens.slice(index, index + size).join(" "));
    }
  }
  return values;
}

function keywords(tokens: string[], vocabulary?: TalkVocabulary) {
  const important = tokens.filter((token) => token.length >= 5 || vocabulary?.normalizedTerms.has(token));
  return Array.from(new Set(important)).slice(0, 18);
}

export function buildSpeakingIndex(items: SpeakingItem[], vocabulary?: TalkVocabulary): SpeakingIndexItem[] {
  let wordCursor = 0;

  return items.map((item, index) => {
    const normalizedText = normalizeTranscript(item.text);
    const tokens = transcriptTokens(item.text);
    const startWordApprox = wordCursor;
    wordCursor += tokens.length;

    return {
      endWordApprox: wordCursor,
      id: item.id,
      index,
      keywords: keywords(tokens, vocabulary),
      kind: item.kind,
      normalizedText,
      originalText: item.text,
      phraseNgrams: ngrams(tokens),
      sectionId: item.sectionId,
      startWordApprox,
      text: item.text,
      tokens
    };
  });
}
