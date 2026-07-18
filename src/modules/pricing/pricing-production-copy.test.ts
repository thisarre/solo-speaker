import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

/**
 * Audit 2026-07-18, reco Copy-1 (P0) : le bloc sous la grille de prix était un
 * copy TECHNIQUE (« Paiement production », mécanisme Stripe) avec un 3e CTA de
 * paiement déconnecté des cartes. Il devient une réassurance qui renvoie à la
 * grille — ces tests verrouillent la non-régression.
 */

async function loadMessages(lang: string) {
  const raw = await readFile(new URL(`../../i18n/messages/${lang}.json`, import.meta.url), "utf-8");
  return JSON.parse(raw) as { pricing: Record<string, string> };
}

test("le bloc production est une réassurance, plus un copy technique (Copy-1)", async () => {
  const fr = await loadMessages("fr");
  const en = await loadMessages("en");
  // Plus de titre technique.
  assert.notEqual(fr.pricing.productionTitle, "Paiement production");
  assert.notEqual(en.pricing.productionTitle, "Production payment");
  // Plus de mécanisme d'implémentation exposé au client.
  assert.doesNotMatch(fr.pricing.productionBody, /Stripe/i, "le corps ne doit plus expliquer Stripe");
  assert.doesNotMatch(en.pricing.productionBody, /Stripe/i);
  // Le CTA du bloc existe dans les deux langues.
  assert.ok(fr.pricing.productionCta && en.pricing.productionCta);
});

test("le bloc production ne déclenche plus un checkout direct (Copy-1)", async () => {
  const source = await readFile(new URL("./components/pricing-page.tsx", import.meta.url), "utf-8");
  const block = source.slice(source.indexOf("productionTitle"));
  assert.doesNotMatch(block, /billing\/checkout/, "le bloc réassurance ne doit plus poster un checkout");
  assert.match(block, /href="#plans"/, "le CTA doit renvoyer à la grille de formules");
  assert.match(source, /id="plans"/, "la grille doit porter l'ancre #plans");
});
