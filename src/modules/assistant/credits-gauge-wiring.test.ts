import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

/** Audit 2026-07-18, reco UX-2 : la jauge est réellement câblée dans le panneau. */

test("le panneau assistant affiche la jauge de crédits et la rafraîchit après action (UX-2)", async () => {
  const source = await readFile(new URL("./components/assistant-panel.tsx", import.meta.url), "utf-8");
  assert.match(source, /useAiCredits\(\)/);
  assert.match(source, /gauge\.visible/);
  assert.match(source, /refreshCredits\(\)/, "la jauge doit suivre la consommation après chaque action");
});

test("les libellés de jauge existent en FR et EN (UX-2)", async () => {
  for (const lang of ["fr", "en"]) {
    const raw = await readFile(new URL(`../../i18n/messages/${lang}.json`, import.meta.url), "utf-8");
    const messages = JSON.parse(raw) as { assistant: Record<string, string> };
    assert.match(messages.assistant.creditsGauge, /\{remaining\}[\s\S]*\{total\}/);
    assert.ok(messages.assistant.creditsGaugeLow.includes("{remaining}"));
  }
});
