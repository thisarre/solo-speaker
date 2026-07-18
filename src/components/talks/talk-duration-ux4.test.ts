import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

/**
 * Audit 2026-07-18, reco UX-4 (P2) : la durée cible n'était demandable
 * qu'après la création, et disparaissait intégralement en mode focus.
 */

test("la création de talk demande la durée cible (UX-4, volet 1)", async () => {
  const form = await readFile(new URL("./NewTalkForm.tsx", import.meta.url), "utf-8");
  assert.match(form, /name="durationMinutes"/, "champ durée absent du formulaire de création");
  const actions = await readFile(new URL("../../modules/talks/actions.ts", import.meta.url), "utf-8");
  assert.match(actions, /parseTalkDurationMinutes/, "l'action doit parser la durée saisie (borné, défaut 10)");
  assert.doesNotMatch(actions, /duration_minutes:\s*10\b/, "plus de durée codée en dur à l'insert");
});

test("le mode focus garde un signal durée avec alerte de dépassement (UX-4, volet 2)", async () => {
  const editor = await readFile(new URL("./TalkEditor.tsx", import.meta.url), "utf-8");
  const block = editor.slice(editor.indexOf("reco UX-4"));
  assert.ok(block.length > 100, "le bloc du signal focus doit exister");
  assert.match(block.slice(0, 900), /focusModeEnabled \?/, "le signal est rendu en mode focus");
  assert.match(block.slice(0, 900), /totalSeconds > draft\.targetDurationMinutes \* 60/, "le dépassement doit être détecté");
  assert.match(block.slice(0, 900), /text-danger/, "le dépassement doit alerter visuellement");
});
