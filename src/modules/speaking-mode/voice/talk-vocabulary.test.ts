import assert from "node:assert/strict";
import test from "node:test";
import { buildTalkVocabulary, expandWithVocabularyAliases } from "./talk-vocabulary";
import type { SpeakingItem } from "../types";

const items: SpeakingItem[] = [
  {
    estimatedSeconds: 10,
    id: "a",
    kind: "body",
    sectionId: "s1",
    sectionIndex: 0,
    segments: [],
    text: "Marc parle du silence. Le silence revient dans cette conclusion importante."
  }
];

test("buildTalkVocabulary extracts repeated and long terms", () => {
  const vocabulary = buildTalkVocabulary({ items, title: "Silence et conclusion" });

  assert.ok(vocabulary.normalizedTerms.has("silence"));
  assert.ok(vocabulary.vocabularyTerms.some((term) => term.includes("conclusion")));
});

test("expandWithVocabularyAliases maps known aliases", () => {
  const vocabulary = buildTalkVocabulary({ items });

  assert.ok(expandWithVocabularyAliases(["marque"], vocabulary).includes("marc"));
});
