import assert from "node:assert/strict";
import test from "node:test";
import { buildShortenSectionPrompt, getShortenTargetWordCount } from "./build-shorten-section-prompt";

const oneHundredWords = Array.from({ length: 100 }, (_, index) => `mot${index + 1}`).join(" ");

test("shorten prompt gives the model a concrete target word count", () => {
  const prompt = buildShortenSectionPrompt(
    {
      audience: "Equipe",
      language: "FR",
      objective: "",
      targetDurationMin: 8,
      title: "Talk",
      type: "conference"
    },
    {
      heading: "Intro",
      body: oneHundredWords
    }
  );

  assert.match(prompt, /Texte actuel: 100 mots/);
  assert.match(prompt, /Maximum vise: 60 mots/);
  assert.match(prompt, /supprimer au moins 40 pour cent/);
});

test("shorten target keeps very small sections usable", () => {
  assert.equal(getShortenTargetWordCount(20), 16);
});

test("expand prompt sizes the rewrite to the section target duration", async () => {
  const { buildSectionExpandPrompt } = await import("./build-section-expand-prompt");
  const talk = {
    title: "Test",
    type: "conference" as const,
    audience: "Développeurs",
    objective: "Convaincre",
    targetDurationMin: 60,
    language: "FR" as const
  };

  const sized = buildSectionExpandPrompt(talk, { heading: "Ouverture", body: "Brouillon.", targetDurationMin: 6 });
  assert.match(sized, /Durée cible de cette section: 6 minutes/);
  // 6 min × 140 words/min (shared WORDS_PER_MINUTE, aligned with duration estimate).
  assert.match(sized, /environ 840 mots/);

  const unsized = buildSectionExpandPrompt(talk, { heading: "Ouverture", body: "Brouillon." });
  assert.doesNotMatch(unsized, /Durée cible de cette section/);
});
