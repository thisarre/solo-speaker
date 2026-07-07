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

test("outline prompt asks for structured durations, never in the heading", () => {
  const prompt = buildTalkOutlinePrompt(talk);

  assert.match(prompt, /champ targetDurationMin/);
  assert.match(prompt, /jamais la durée dans le titre/);
});

test("outline prompt keeps a sane section range for very short talks", () => {
  const prompt = buildTalkOutlinePrompt({ ...talk, targetDurationMin: 5 });

  assert.match(prompt, /entre 1 et 2 sections/);
});
