import assert from "node:assert/strict";
import test from "node:test";
import { aiCreditsGaugeModel } from "./ai-credits-gauge";
import { trialAiCredits } from "./ai-credits";

/** Audit 2026-07-18, reco UX-2 : visibilité des crédits AVANT le mur. */

test("jauge : visible en Essai, avec restant et ratio exacts (UX-2)", () => {
  const g = aiCreditsGaugeModel({ plan: "trial", used: 7 });
  assert.deepEqual(
    { visible: g.visible, used: g.used, remaining: g.remaining, total: g.total },
    { visible: true, used: 7, remaining: trialAiCredits - 7, total: trialAiCredits }
  );
  assert.equal(g.low, false);
});

test("jauge : invisible pour les plans payants (illimité, zéro bruit d'UI)", () => {
  for (const plan of ["studio", "pro", "team"] as const) {
    assert.equal(aiCreditsGaugeModel({ plan, used: 12 }).visible, false, plan);
  }
});

test("jauge : alerte « low » quand il reste ≤ 20 % (avant le mur, pas dessus)", () => {
  const threshold = Math.ceil(trialAiCredits * 0.2);
  assert.equal(aiCreditsGaugeModel({ plan: "trial", used: trialAiCredits - threshold }).low, true);
  assert.equal(aiCreditsGaugeModel({ plan: "trial", used: trialAiCredits - threshold - 1 }).low, false);
});

test("jauge : bornée (used négatif ou > total, null)", () => {
  assert.equal(aiCreditsGaugeModel({ plan: "trial", used: null }).used, 0);
  assert.equal(aiCreditsGaugeModel({ plan: "trial", used: -3 }).used, 0);
  assert.equal(aiCreditsGaugeModel({ plan: "trial", used: 999 }).remaining, 0);
});
