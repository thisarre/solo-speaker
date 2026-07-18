/**
 * Vérificateur de grants des migrations Supabase (audit 2026-07-18, reco
 * Technique-3, Majeur). Classe d'incident visée — celle du 07/07, DÉJÀ survenue
 * en prod : une table passe en « UPDATE par colonnes » pour un rôle (revoke +
 * grant update (colonnes…)), puis une migration ULTÉRIEURE ajoute une colonne
 * sans le grant correspondant → « permission denied » silencieux jusqu'au
 * crash utilisateur (onboarding cassé).
 *
 * Règle mécanique : pour chaque (table, rôle) passé en mode « colonnes », toute
 * colonne ajoutée ensuite doit être soit couverte par un `grant update (…col…)`
 * au même rôle, soit ANNOTÉE volontairement réservée :
 *   -- grants-check: service-only <table>.<colonne>
 * (même famille que les exclusions listées : jamais d'absence inexpliquée).
 */

export type MigrationFile = { name: string; sql: string };

export type GrantViolation = {
  table: string;
  column: string;
  role: string;
  addedIn: string;
  restrictedSince: string;
  message: string;
};

const norm = (sql: string) =>
  sql
    .replace(/--[^\n]*/g, "") // les commentaires ne sont pas du SQL effectif
    .replace(/\s+/g, " ")
    .toLowerCase();

const tableName = (raw: string) => raw.replace(/^public\./, "").replace(/"/g, "");

export function checkMigrationGrants(files: MigrationFile[]): GrantViolation[] {
  const ordered = [...files].sort((a, b) => a.name.localeCompare(b.name, "en"));

  // (table|role) → index de la migration qui a instauré le mode « colonnes ».
  const restrictedSince = new Map<string, number>();
  // (table|role) → colonnes couvertes par un grant update (…) — tous fichiers.
  const grantedColumns = new Map<string, Set<string>>();
  // Annotations volontaires (lues AVANT strip des commentaires).
  const serviceOnly = new Set<string>();
  // Colonnes ajoutées : { table, column, index }.
  const added: { table: string; column: string; index: number }[] = [];

  ordered.forEach((file, index) => {
    for (const m of file.sql.matchAll(/grants-check:\s*service-only\s+([\w."]+)\.([\w"]+)/gi)) {
      serviceOnly.add(`${tableName(m[1])}.${m[2].replace(/"/g, "").toLowerCase()}`);
    }
    const sql = norm(file.sql);

    // revoke update on <table> from <roles> → mode « colonnes » pour ces rôles.
    for (const m of sql.matchAll(/revoke\s+([^;]*?update[^;]*?)\s+on\s+(?:table\s+)?([\w."]+)\s+from\s+([^;]+);/g)) {
      const table = tableName(m[2]);
      for (const role of m[3].split(",").map((r) => r.trim())) {
        const key = `${table}|${role}`;
        if (!restrictedSince.has(key)) restrictedSince.set(key, index);
      }
    }

    // grant update (col, …) on <table> to <roles> → mode « colonnes » + couverture.
    for (const m of sql.matchAll(/grant\s+update\s*\(([^)]+)\)\s*on\s+(?:table\s+)?([\w."]+)\s+to\s+([^;]+);/g)) {
      const table = tableName(m[2]);
      const cols = m[1].split(",").map((c) => c.trim().replace(/"/g, ""));
      for (const role of m[3].split(",").map((r) => r.trim())) {
        const key = `${table}|${role}`;
        if (!restrictedSince.has(key)) restrictedSince.set(key, index);
        const set = grantedColumns.get(key) ?? new Set<string>();
        for (const c of cols) set.add(c);
        grantedColumns.set(key, set);
      }
    }

    // alter table <table> add column [if not exists] <col>
    for (const m of sql.matchAll(/alter\s+table\s+(?:if\s+exists\s+)?([\w."]+)\s+add\s+column\s+(?:if\s+not\s+exists\s+)?([\w"]+)/g)) {
      added.push({ table: tableName(m[1]), column: m[2].replace(/"/g, ""), index });
    }
  });

  const violations: GrantViolation[] = [];
  for (const a of added) {
    for (const [key, since] of restrictedSince) {
      const [table, role] = key.split("|");
      if (table !== a.table || since > a.index) continue; // durcissement postérieur : la colonne est née avant lui
      if (grantedColumns.get(key)?.has(a.column)) continue;
      if (serviceOnly.has(`${a.table}.${a.column}`)) continue;
      violations.push({
        table: a.table,
        column: a.column,
        role,
        addedIn: ordered[a.index].name,
        restrictedSince: ordered[since].name,
        message:
          `${a.table}.${a.column} (ajoutée dans ${ordered[a.index].name}) n'a aucun ` +
          `« grant update (${a.column}) » pour ${role}, alors que ${a.table} est en UPDATE ` +
          `par colonnes depuis ${ordered[since].name} — le motif exact de l'incident du 07/07. ` +
          `Ajouter le grant, ou annoter « -- grants-check: service-only ${a.table}.${a.column} » si c'est voulu.`,
      });
    }
  }
  return violations;
}
