import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

/**
 * Audit 2026-07-18, reco Technique-2 (Majeur) : la confirmation STT reposait
 * sur 3 écritures séparées non transactionnelles (TOCTOU → double comptage
 * possible sur confirmations concurrentes). Ces gardes verrouillent le
 * correctif : fonction Postgres unique + route branchée dessus.
 */

const MIGRATION = "../../../supabase/migrations/20260718190000_confirm_stt_session_transactional.sql";

test("la migration confirm_stt_session est transactionnelle et verrouillée (Technique-2)", async () => {
  const sql = await readFile(new URL(MIGRATION, import.meta.url), "utf-8");
  assert.match(sql, /for update/i, "SELECT … FOR UPDATE requis (sérialise les confirmations concurrentes)");
  assert.match(sql, /security invoker/i);
  assert.match(sql, /set search_path = public, pg_temp/i);
  assert.match(sql, /revoke all on function public\.confirm_stt_session[\s\S]*?from anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.confirm_stt_session[\s\S]*?to service_role/i);
  // Garde d'idempotence : un second appel voit status = confirmed.
  assert.match(sql, /status = 'confirmed'/);
  // Sémantique du compteur = applyConfirmation (spécification exécutable) :
  assert.match(sql, /greatest\(0, public\.usage_counters\.cloud_reserved_seconds - v_session\.reserved_seconds\)/);
  assert.match(sql, /cloud_confirmed_seconds \+ v_confirmed_seconds/);
  assert.match(sql, /on conflict \(user_id, period_key\)/);
});

test("la route STT confirme via le RPC, plus par écritures séparées (Technique-2)", async () => {
  const source = await readFile(new URL("../../app/api/stt/session/route.ts", import.meta.url), "utf-8");
  assert.match(source, /rpc\("confirm_stt_session"/);
  assert.doesNotMatch(source, /from\("stt_sessions"\)[\s\S]*?\.update\(/, "plus d'UPDATE applicatif séparé sur stt_sessions");
  assert.doesNotMatch(source, /from\("usage_counters"\)[\s\S]*?\.upsert\(/, "plus d'UPSERT applicatif séparé sur usage_counters");
  // L'échec d'écriture n'est plus silencieux (« drift silencieux » de l'audit).
  assert.match(source, /status: 500/);
});
