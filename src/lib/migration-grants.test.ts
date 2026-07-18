import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import { checkMigrationGrants, type MigrationFile } from "./migration-grants";

/**
 * Audit 2026-07-18, reco Technique-3 (Majeur) : l'incident du 07/07 (colonne
 * profiles.locale ajoutée après le durcissement par colonnes, sans grant →
 * onboarding cassé en prod) doit être détectable MÉCANIQUEMENT.
 */

function realCorpus(): MigrationFile[] {
  const dir = new URL("../../supabase/migrations/", import.meta.url);
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((name) => ({ name, sql: readFileSync(new URL(name, dir), "utf-8") }));
}

test("le corpus réel de migrations passe le vérificateur de grants (Technique-3)", () => {
  const violations = checkMigrationGrants(realCorpus());
  assert.deepEqual(violations, [], violations.map((v) => v.message).join("\n"));
});

test("l'incident du 07/07 est DÉTECTÉ si son fix est retiré (preuve historique, Technique-3)", () => {
  const corpus = realCorpus().filter((f) => !f.name.includes("20260707150000_grant_profiles_locale_update"));
  const violations = checkMigrationGrants(corpus);
  const hit = violations.find((v) => v.table === "profiles" && v.column === "locale" && v.role === "authenticated");
  assert.ok(hit, "la colonne locale sans grant aurait dû être détectée (l'incident réel)");
  assert.match(hit.message, /incident du 07\/07/);
});

test("une colonne volontairement service-only s'annote au lieu d'échouer (Technique-3)", () => {
  const corpus: MigrationFile[] = [
    { name: "001_harden.sql", sql: "revoke update on public.profiles from authenticated;\ngrant update (full_name) on public.profiles to authenticated;" },
    { name: "002_add.sql", sql: "-- grants-check: service-only profiles.billing_secret\nalter table public.profiles add column billing_secret text;" },
  ];
  assert.deepEqual(checkMigrationGrants(corpus), []);
  // Sans l'annotation → violation.
  const noAnnotation = corpus.map((f) => ({ ...f, sql: f.sql.replace(/-- grants-check[^\n]*\n/, "") }));
  assert.equal(checkMigrationGrants(noAnnotation).length, 1);
});

test("un durcissement POSTÉRIEUR à la colonne ne la signale pas (elle est née avant, Technique-3)", () => {
  const corpus: MigrationFile[] = [
    { name: "001_add.sql", sql: "alter table public.profiles add column nickname text;" },
    { name: "002_harden.sql", sql: "revoke update on public.profiles from authenticated;\ngrant update (nickname) on public.profiles to authenticated;" },
  ];
  assert.deepEqual(checkMigrationGrants(corpus), []);
});
