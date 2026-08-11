import assert from "node:assert/strict";
import test from "node:test";
import { buildTalkOutlinePrompt } from "./build-talk-outline-prompt";
import type { AssistantTalkContext } from "@/modules/assistant/types";

const talk: AssistantTalkContext = {
  title: "Ma conférence",
  type: "conference",
  audience: "Développeurs",
  objective: "Convaincre",
  targetDurationMin: 60,
  language: "FR"
};

test("outline prompt scales the section count with the target duration", () => {
  const prompt = buildTalkOutlinePrompt(talk);

  assert.match(prompt, /Durée cible: 60 minutes\./);
  assert.match(prompt, /entre 6 et 12 sections/);
  assert.match(prompt, /somme des targetDurationMin doit être égale à la durée cible totale/);
});

test("outline prompt sizes the drafts to the target duration (140 words/min)", () => {
  const prompt = buildTalkOutlinePrompt(talk);

  // 60 min × 140 words/min = 8400 words of spoken material.
  assert.match(prompt, /avoisiner 8400 mots/);
  assert.match(prompt, /140 mots par minute/);
  assert.match(prompt, /proportionnelle à son targetDurationMin/);
  assert.match(prompt, /prêt à être lu à voix haute/);
});

test("outline prompt keeps the draft budget proportional for short talks", () => {
  const prompt = buildTalkOutlinePrompt({ ...talk, targetDurationMin: 10 });

  // 10 min × 140 words/min = 1400 words — no longer the old flat 1-2 min output.
  assert.match(prompt, /avoisiner 1400 mots/);
});

test("outline prompt asks for structured durations, never in the heading", () => {
  const prompt = buildTalkOutlinePrompt(talk);

  assert.match(prompt, /champ targetDurationMin/);
  assert.match(prompt, /jamais la durée dans le titre/);
});

test("outline prompt keeps a sane section range for very short talks", () => {
  const prompt = buildTalkOutlinePrompt({ ...talk, targetDurationMin: 5 });

  assert.match(prompt, /entre 1 et 2 sections/);
});
