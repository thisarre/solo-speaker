import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

/**
 * Audit 2026-07-18, reco Copy-2 (P0) : trois libellés différents pointaient
 * vers la même action d'essai gratuit sur la home publique (« Créer une prise
 * de parole », « Démarrer l'essai gratuit », « Démarrer gratuitement »),
 * affaiblissant la reconnaissance du CTA principal. Unifié sur
 * common.startFreeTrial ; common.createTalk reste réservé au contexte in-app.
 */

test("la home publique n'utilise qu'UN libellé pour l'essai gratuit (Copy-2)", async () => {
  const source = await readFile(new URL("./components/landing-page.tsx", import.meta.url), "utf-8");
  assert.doesNotMatch(source, /common\.createTalk/, "createTalk est réservé à l'in-app, pas à la home publique");
  assert.doesNotMatch(source, /heroSecondaryCta/, "le libellé concurrent du hero doit rester supprimé");
  const occurrences = source.match(/common\.startFreeTrial/g) ?? [];
  assert.ok(occurrences.length >= 3, `startFreeTrial attendu sur les 3 sites (header, header mobile, hero) — trouvé ${occurrences.length}`);
});

test("la clé heroSecondaryCta n'existe plus dans les messages (Copy-2)", async () => {
  for (const lang of ["fr", "en"]) {
    const raw = await readFile(new URL(`../../i18n/messages/${lang}.json`, import.meta.url), "utf-8");
    const messages = JSON.parse(raw) as { landing: Record<string, unknown>; common: Record<string, unknown> };
    assert.equal(messages.landing.heroSecondaryCta, undefined, `${lang} : clé orpheline`);
    assert.ok(messages.common.startFreeTrial, `${lang} : le libellé canonique doit exister`);
    assert.ok(messages.common.createTalk, `${lang} : createTalk reste pour l'in-app (recherche, /talks/new)`);
  }
});
