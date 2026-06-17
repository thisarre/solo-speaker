import { normalizeTranscript, transcriptTokens } from "@/modules/speaking-mode/voice/normalize-transcript";
import type { TranscriptMatchItem, VoiceFollowMatch } from "@/modules/speaking-mode/voice/types";
import { expandWithVocabularyAliases, type TalkVocabulary } from "./talk-vocabulary";

type MatchCandidate = {
  item: TranscriptMatchItem;
  confidence: number;
  matchedWords: string[];
  matchedText: string;
  reason: string;
  searchScope: "local" | "global";
};

const stopWords = new Set([
  "avec",
  "dans",
  "des",
  "donc",
  "elle",
  "elles",
  "est",
  "les",
  "leur",
  "leurs",
  "mais",
  "nous",
  "notre",
  "pour",
  "que",
  "qui",
  "sur",
  "tout",
  "une",
  "vous",
  "your",
  "that",
  "the",
  "this",
  "with"
]);

function comparableTokens(tokens: string[]) {
  const filtered = tokens.filter((token) => token.length > 3 && !stopWords.has(token));
  return filtered.length >= 3 ? filtered : tokens;
}

function tokenOverlapScore(transcriptTokensValue: string[], itemTokensValue: string[]) {
  const transcript = comparableTokens(transcriptTokensValue);
  const item = comparableTokens(itemTokensValue);
  if (!transcript.length || !item.length) return 0;

  const itemTokenSet = new Set(item);
  const overlapping = transcript.filter((token) => itemTokenSet.has(token)).length;
  const coverage = overlapping / Math.min(transcript.length, item.length);
  const density = overlapping / Math.max(transcript.length, item.length);

  return coverage * 0.78 + density * 0.22;
}

function orderedScore(transcriptTokensValue: string[], itemTokensValue: string[]) {
  const transcript = comparableTokens(transcriptTokensValue);
  const item = comparableTokens(itemTokensValue);
  if (!transcript.length || !item.length) return 0;

  let itemIndex = 0;
  let matched = 0;

  for (const token of transcript) {
    while (itemIndex < item.length && item[itemIndex] !== token) {
      itemIndex += 1;
    }

    if (item[itemIndex] === token) {
      matched += 1;
      itemIndex += 1;
    }
  }

  return matched / transcript.length;
}

function longestRunScore(transcriptTokensValue: string[], itemTokensValue: string[]) {
  const transcript = comparableTokens(transcriptTokensValue);
  const item = comparableTokens(itemTokensValue);
  if (!transcript.length || !item.length) return 0;

  let best = 0;

  for (let transcriptIndex = 0; transcriptIndex < transcript.length; transcriptIndex += 1) {
    for (let itemIndex = 0; itemIndex < item.length; itemIndex += 1) {
      let run = 0;

      while (
        transcriptIndex + run < transcript.length &&
        itemIndex + run < item.length &&
        transcript[transcriptIndex + run] === item[itemIndex + run]
      ) {
        run += 1;
      }

      best = Math.max(best, run);
    }
  }

  return best / Math.min(transcript.length, 8);
}

function ngrams(tokens: string[], size: number) {
  if (tokens.length < size) return [];
  return Array.from({ length: tokens.length - size + 1 }, (_, index) => tokens.slice(index, index + size).join(" "));
}

function ngramScore(transcriptTokensValue: string[], itemTokensValue: string[]) {
  const transcript = comparableTokens(transcriptTokensValue);
  const item = comparableTokens(itemTokensValue);
  if (transcript.length < 2 || item.length < 2) return 0;

  const transcriptNgrams = [...ngrams(transcript, 2), ...ngrams(transcript, 3)];
  const itemNgramSet = new Set([...ngrams(item, 2), ...ngrams(item, 3)]);
  if (!transcriptNgrams.length || !itemNgramSet.size) return 0;

  const overlap = transcriptNgrams.filter((ngram) => itemNgramSet.has(ngram)).length;
  return overlap / transcriptNgrams.length;
}

function phraseScore(transcriptText: string, itemText: string) {
  if (!transcriptText || !itemText) return 0;
  if (itemText.includes(transcriptText)) return Math.min(1, transcriptText.length / Math.max(28, itemText.length)) + 0.32;
  if (transcriptText.includes(itemText)) return 0.9;
  return 0;
}

function transcriptWindows(tokens: string[]) {
  const windows: Array<{ recency: number; tokens: string[] }> = [];
  const maxWindowLength = Math.min(10, tokens.length);
  const minWindowLength = Math.min(4, maxWindowLength);
  const searchStart = Math.max(0, tokens.length - 14);
  const searchSpan = Math.max(1, tokens.length - searchStart);

  for (let length = maxWindowLength; length >= minWindowLength; length -= 1) {
    for (let start = searchStart; start <= tokens.length - length; start += 1) {
      const end = start + length;
      windows.push({
        recency: (end - searchStart) / searchSpan,
        tokens: tokens.slice(start, end)
      });
    }
  }

  return windows.length ? windows : [{ recency: 1, tokens }];
}

function vocabularyScore(windowTokens: string[], itemTokensValue: string[], vocabulary?: TalkVocabulary) {
  if (!vocabulary) return 0;
  const expandedTranscript = expandWithVocabularyAliases(windowTokens, vocabulary);
  const expandedItem = expandWithVocabularyAliases(itemTokensValue, vocabulary);
  return tokenOverlapScore(expandedTranscript, expandedItem);
}

function scoreWindow(windowTokens: string[], itemTokensValue: string[], itemText: string, vocabulary?: TalkVocabulary) {
  const recentText = normalizeTranscript(windowTokens.join(" "));
  const overlap = tokenOverlapScore(windowTokens, itemTokensValue);
  const ordered = orderedScore(windowTokens, itemTokensValue);
  const run = longestRunScore(windowTokens, itemTokensValue);
  const ngram = ngramScore(windowTokens, itemTokensValue);
  const vocabularyHit = vocabularyScore(windowTokens, itemTokensValue, vocabulary);
  const phrase = Math.min(1, phraseScore(recentText, itemText));
  const fuzzy = run * 0.32 + ngram * 0.28 + ordered * 0.18 + overlap * 0.12 + vocabularyHit * 0.1;

  return {
    reason: phrase >= fuzzy ? "phrase" : vocabularyHit > 0.3 ? "fuzzy+vocabulary" : ngram > overlap ? "ngram" : "overlap",
    score: Math.max(phrase, fuzzy)
  };
}

function itemIndex(item: TranscriptMatchItem, fallback: number) {
  return item.index ?? fallback;
}

function scopedItems(input: {
  currentIndex: number;
  items: TranscriptMatchItem[];
  lostForMs: number;
}) {
  const localStart = input.currentIndex - 6;
  const localEnd = input.currentIndex + 14;
  const local = input.items.filter((item, fallbackIndex) => {
    const index = itemIndex(item, fallbackIndex);
    return index >= localStart && index <= localEnd;
  });

  if (local.length || input.lostForMs <= 3000) {
    return { items: local.length ? local : input.items.slice(0, 20), searchScope: "local" as const };
  }

  return { items: input.items, searchScope: "global" as const };
}

export function matchTranscriptToItems(input: {
  currentIndex?: number;
  alternatives?: string[];
  items: TranscriptMatchItem[];
  lostForMs?: number;
  maxTranscriptWords?: number;
  transcript: string;
  vocabulary?: TalkVocabulary;
}): VoiceFollowMatch {
  const maxTranscriptWords = input.maxTranscriptWords ?? 12;
  const transcriptTexts = [input.transcript, ...(input.alternatives ?? [])].filter(Boolean);
  const recentTokens = transcriptTokens(input.transcript).slice(-maxTranscriptWords);

  if (recentTokens.length < 3 || !input.items.length) {
    return { confidence: 0, matchedIndex: null, matchedItemId: null, matchedText: "", matchedWords: [], reason: "empty", searchScope: "local", sectionId: null };
  }

  const allWindows = transcriptTexts.flatMap((text) => transcriptWindows(transcriptTokens(text).slice(-maxTranscriptWords)));
  const scope = scopedItems({
    currentIndex: input.currentIndex ?? 0,
    items: input.items,
    lostForMs: input.lostForMs ?? 0
  });
  const candidates = scope.items
    .map((item, scopedIndex): MatchCandidate => {
      const itemText = item.normalizedText ?? normalizeTranscript(item.text);
      const itemTokens = item.tokens ?? transcriptTokens(item.text);
      let bestScore = 0;
      let bestWindow = recentTokens;
      let bestReason = "overlap";

      for (const window of allWindows) {
        const recencyBoost = 0.76 + window.recency * 0.24;
        const scored = scoreWindow(window.tokens, itemTokens, itemText, input.vocabulary);
        const score = scored.score * recencyBoost;
        if (score > bestScore) {
          bestScore = score;
          bestWindow = window.tokens;
          bestReason = scored.reason;
        }
      }

      const kindPenalty = item.kind === "heading" ? 0.72 : 1;
      const distance = Math.abs(itemIndex(item, scopedIndex) - (input.currentIndex ?? 0));
      const proximityBoost = Math.max(0.72, 1 - distance * 0.018);
      const confidence = Math.min(1, bestScore * kindPenalty * proximityBoost);

      return {
        item,
        confidence,
        matchedWords: comparableTokens(bestWindow).filter((token) => new Set(itemTokens).has(token)),
        matchedText: normalizeTranscript(bestWindow.join(" ")),
        reason: bestReason,
        searchScope: scope.searchScope
      };
    })
    .sort((a, b) => b.confidence - a.confidence);

  const best = candidates[0];
  if (!best || best.confidence <= 0) {
    return { confidence: 0, matchedIndex: null, matchedItemId: null, matchedText: normalizeTranscript(recentTokens.join(" ")), matchedWords: [], reason: "no-candidate", searchScope: scope.searchScope, sectionId: null };
  }

  return {
    confidence: Number(best.confidence.toFixed(2)),
    matchedIndex: best.item.index ?? input.items.findIndex((item) => item.id === best.item.id),
    matchedItemId: best.item.id,
    matchedText: best.matchedText,
    matchedWords: best.matchedWords,
    reason: best.reason,
    searchScope: best.searchScope,
    sectionId: best.item.sectionId
  };
}
