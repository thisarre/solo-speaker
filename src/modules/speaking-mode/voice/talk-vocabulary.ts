import type { SpeakingItem } from "@/modules/speaking-mode/types";
import { normalizeTranscript, transcriptTokens } from "./normalize-transcript";

export type TalkVocabulary = {
  aliases: Record<string, string[]>;
  normalizedTerms: Set<string>;
  vocabularyTerms: string[];
};

const baseAliases: Record<string, string[]> = {
  marc: ["marque"],
  poser: ["pose", "posez", "posait"],
  silence: ["silences"],
  propresenter: ["pro presenter", "pro-presenter", "pro présenteur"]
};

function tokenNgrams(tokens: string[], min = 2, max = 4) {
  const phrases: string[] = [];
  for (let size = min; size <= max; size += 1) {
    for (let index = 0; index <= tokens.length - size; index += 1) {
      phrases.push(tokens.slice(index, index + size).join(" "));
    }
  }
  return phrases;
}

export function buildTalkVocabulary(input: { items: SpeakingItem[]; title?: string }): TalkVocabulary {
  const source = [input.title ?? "", ...input.items.map((item) => item.text)].join(" ");
  const tokens = transcriptTokens(source);
  const counts = new Map<string, number>();

  tokens.forEach((token) => counts.set(token, (counts.get(token) ?? 0) + 1));

  const importantWords = tokens.filter((token) => {
    const repeated = (counts.get(token) ?? 0) >= 2;
    const long = token.length >= 7;
    return repeated || long;
  });

  const phrases = tokenNgrams(tokens).filter((phrase) => phrase.length >= 9);
  const vocabularyTerms = Array.from(new Set([...importantWords, ...phrases])).slice(0, 240);
  const aliases = { ...baseAliases };
  const normalizedTerms = new Set<string>();

  vocabularyTerms.forEach((term) => normalizedTerms.add(normalizeTranscript(term)));
  Object.entries(aliases).forEach(([canonical, values]) => {
    normalizedTerms.add(normalizeTranscript(canonical));
    values.forEach((value) => normalizedTerms.add(normalizeTranscript(value)));
  });

  return { aliases, normalizedTerms, vocabularyTerms };
}

export function expandWithVocabularyAliases(tokens: string[], vocabulary: TalkVocabulary) {
  const expanded = new Set(tokens);

  tokens.forEach((token) => {
    Object.entries(vocabulary.aliases).forEach(([canonical, aliases]) => {
      const normalizedAliases = aliases.map(normalizeTranscript);
      if (token === canonical || normalizedAliases.includes(token)) {
        expanded.add(canonical);
        normalizedAliases.forEach((alias) => expanded.add(alias));
      }
    });
  });

  return Array.from(expanded);
}
