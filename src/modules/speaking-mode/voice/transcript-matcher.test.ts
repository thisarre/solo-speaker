import assert from "node:assert/strict";
import test from "node:test";
import { matchTranscriptToItems } from "./transcript-matcher";
import type { TranscriptMatchItem } from "./types";

const items: TranscriptMatchItem[] = [
  {
    id: "intro",
    sectionId: "s1",
    kind: "body",
    text: "Bienvenue a tous. Aujourd'hui nous allons clarifier le message principal de cette conference."
  },
  {
    id: "story",
    sectionId: "s2",
    kind: "body",
    text: "Je veux commencer par une histoire simple qui montre pourquoi cette decision change la suite."
  },
  {
    id: "close",
    sectionId: "s3",
    kind: "body",
    text: "Pour conclure, retenez une action concrete a poser des demain matin."
  }
];

test("matchTranscriptToItems finds the closest speaking item", () => {
  const match = matchTranscriptToItems({
    items,
    transcript: "je veux commencer par une histoire simple qui montre pourquoi"
  });

  assert.equal(match.matchedItemId, "story");
  assert.equal(match.sectionId, "s2");
  assert.ok(match.confidence >= 0.54);
});

test("matchTranscriptToItems uses recent transcript words", () => {
  const match = matchTranscriptToItems({
    items,
    maxTranscriptWords: 7,
    transcript: "du texte ancien sans rapport puis pour conclure retenez une action concrete"
  });

  assert.equal(match.matchedItemId, "close");
});

test("matchTranscriptToItems stays low confidence for improvisation", () => {
  const match = matchTranscriptToItems({
    items,
    transcript: "la meteo et le cafe ne concernent pas le contenu prepare"
  });

  assert.ok(match.confidence < 0.34);
});

test("matchTranscriptToItems follows a partial sentence inside the right paragraph", () => {
  const qaItems: TranscriptMatchItem[] = [
    {
      id: "brief",
      sectionId: "s1",
      kind: "body",
      text: "Objectif: valider le parcours MVP de Solo Speaker avec IA, PDF et Speaking Mode."
    },
    {
      id: "conclusion",
      sectionId: "s3",
      kind: "body",
      text: "Tout se passe dans le même studio. En bref, un seul espace pour couvrir toutes les étapes."
    }
  ];

  const match = matchTranscriptToItems({
    items: qaItems,
    transcript: "tout se passe dans le meme studio"
  });

  assert.equal(match.matchedItemId, "conclusion");
  assert.ok(match.confidence >= 0.46);
  assert.equal(match.matchedText, "tout passe dans meme studio");
});

test("matchTranscriptToItems prefers body content over matching headings", () => {
  const headingItems: TranscriptMatchItem[] = [
    {
      id: "heading",
      sectionId: "s1",
      kind: "heading",
      text: "1 · Conclusion"
    },
    {
      id: "body",
      sectionId: "s1",
      kind: "body",
      text: "Pour conclure, retenez une action concrete a poser des demain matin."
    }
  ];

  const match = matchTranscriptToItems({
    items: headingItems,
    transcript: "pour conclure retenez une action concrete"
  });

  assert.equal(match.matchedItemId, "body");
});

test("matchTranscriptToItems prefers the latest spoken sentence over the previous one", () => {
  const sequenceItems: TranscriptMatchItem[] = [
    {
      id: "previous",
      sectionId: "s1",
      kind: "body",
      text: "Conserver le fond et les formulations percutantes."
    },
    {
      id: "next",
      sectionId: "s1",
      kind: "body",
      text: "Conclure de façon nette et facile à prononcer."
    }
  ];

  const match = matchTranscriptToItems({
    items: sequenceItems,
    transcript: "conserver le fond et les formulations percutantes conclure de facon nette et facile a prononcer"
  });

  assert.equal(match.matchedItemId, "next");
  assert.ok(match.confidence >= 0.46);
});

test("matchTranscriptToItems switches to the new sentence a few words in (no lag)", () => {
  const sequenceItems: TranscriptMatchItem[] = [
    {
      id: "previous",
      sectionId: "s1",
      kind: "body",
      index: 10,
      text: "Conserver le fond et les formulations percutantes du discours original."
    },
    {
      id: "next",
      sectionId: "s1",
      kind: "body",
      index: 11,
      text: "Definir ensuite le premier test concret immediatement reutilisable."
    }
  ];

  // The whole previous sentence is still in the rolling buffer, but the speaker has just started
  // the next one ("definir ensuite le premier test"). The prompter must already be on "next".
  const match = matchTranscriptToItems({
    currentIndex: 10,
    items: sequenceItems,
    transcript: "conserver le fond et les formulations percutantes du discours original definir ensuite le premier test"
  });

  assert.equal(match.matchedItemId, "next");
});
