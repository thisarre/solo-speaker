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
