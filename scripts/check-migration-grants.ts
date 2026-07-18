/**
 * CLI du vérificateur de grants (audit 2026-07-18, Technique-3) — CI-ready :
 * exit 0 si aucun écart, 1 sinon.   npx tsx scripts/check-migration-grants.ts
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { checkMigrationGrants } from "../src/lib/migration-grants";

const dir = path.join(process.cwd(), "supabase", "migrations");
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((name) => ({ name, sql: readFileSync(path.join(dir, name), "utf-8") }));

const violations = checkMigrationGrants(files);
if (violations.length === 0) {
  console.log(`✅ Grants OK — ${files.length} migrations vérifiées (aucune colonne ajoutée sans grant après durcissement).`);
  process.exit(0);
}
console.error(`❌ ${violations.length} écart(s) de grants :`);
for (const v of violations) console.error(`  - ${v.message}`);
process.exit(1);
