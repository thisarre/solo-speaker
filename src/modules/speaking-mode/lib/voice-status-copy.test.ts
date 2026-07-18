import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

/**
 * Audit 2026-07-18, reco UX-3 (Majeur) : en suivi incertain/perdu, le prompteur
 * affichait du jargon (« incertain 42% », « perdu ») au moment le plus
 * stressant. Les statuts doivent être des CONSEILS ACTIONNABLES ; le détail
 * technique reste dans le panneau Réglages/debug.
 */

async function speakingCopy(lang: string) {
  const raw = await readFile(new URL(`../../../i18n/messages/${lang}.json`, import.meta.url), "utf-8");
  return (JSON.parse(raw) as { speakingMode: Record<string, string> }).speakingMode;
}

test("statuts vocaux incertain/perdu = conseils actionnables, sans jargon (UX-3)", async () => {
  for (const lang of ["fr", "en"]) {
    const copy = await speakingCopy(lang);
    assert.doesNotMatch(copy.uncertain, /\{confidence\}|%/, `${lang} : plus de % de confidence dans le statut`);
    assert.ok(copy.uncertain.length > 20, `${lang} : un conseil, pas un mot (« incertain »)`);
    assert.ok(copy.lost.length > 20, `${lang} : un conseil, pas un mot (« perdu »)`);
    assert.match(copy.uncertain, /micro|mic|fort|louder/i, `${lang} : le conseil doit être actionnable`);
    assert.match(copy.lost, /ligne|line|repren|resume/i, `${lang} : le conseil doit dire quoi faire`);
  }
});

test("SpeakingControls n'interpole plus la confidence dans le statut incertain (UX-3)", async () => {
  const source = await readFile(new URL("../components/SpeakingControls.tsx", import.meta.url), "utf-8");
  assert.doesNotMatch(source, /copy\.uncertain\.replace/, "le statut incertain ne porte plus le % technique");
  // Le panneau debug garde le détail technique (l'audit ne demande pas sa suppression).
  assert.match(source, /DebugRow label="confidence"/);
});
