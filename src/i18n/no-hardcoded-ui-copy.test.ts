import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";

const root = process.cwd();
const ignoredPatterns = [
  /\.test\./,
  /src\/i18n\/messages\//,
  /src\/modules\/assistant\/prompts\//,
  /src\/modules\/landing\/seo\.ts/,
  /src\/app\/api\//,
  /src\/modules\/speaking-mode\/voice\//,
  /\/(mentions-legales|cgv|confidentialite)\//
];

const ignoredLinePatterns = [
  /^\s*import\b/,
  /^\s*export type\b/,
  /\b(className|data-|href|id|key|name|type|value|variant)=/,
  /\b(kind|status|type|id|href|target|role|tone|position|size):\s*["'`]/,
  /\b(startsWith|includes|capture|select|from|eq|insert|update|delete)\(/,
  /\b(localizedPath|redirect|encodeURIComponent|new URL|posthog|process\.env)\b/,
  /\bconsole\./,
  /\bconst\s+\w+\s*=\s*["'`][a-z0-9_:/?&=.#%-]+["'`]/i,
  /\b[A-Za-z]+\[[^\]]+\]/,
  /<Button[^>]*(aria-label|title)=/,
  /<Link\b/,
  /<a\b/
];

const frenchCopyPattern = /["'`][^"'`\n]*(?:[À-ÿ]|\b(?:Ajoute|Ajouter|Aucun|Choisissez|Créer|Déconnexion|Demande|Finaliser|Génération|Impossible|Nouveau|Nouvelle|Prédiction|Réponse|Répéter|Sans titre|Supprimer|Transcription|Voir les réglages)\b)[^"'`\n]*["'`]|>[^<{]*(?:[À-ÿ]|\b(?:Ajoute|Ajouter|Aucun|Choisissez|Créer|Déconnexion|Demande|Finaliser|Génération|Impossible|Nouveau|Nouvelle|Prédiction|Réponse|Répéter|Sans titre|Supprimer|Transcription|Voir les réglages)\b)[^<]*</;

function findSourceFiles(directory: string): string[] {
  return readdirSync(join(root, directory)).flatMap((entry) => {
    const path = join(directory, entry);
    const absolutePath = join(root, path);
    if (statSync(absolutePath).isDirectory()) return findSourceFiles(path);
    return /\.(ts|tsx)$/.test(path) ? [path] : [];
  });
}

test("UI copy is sourced from i18n dictionaries instead of inline French strings", () => {
  const files = ["src/app", "src/components", "src/modules"]
    .flatMap(findSourceFiles)
    .filter((file) => !ignoredPatterns.some((pattern) => pattern.test(file)));

  const offenders = files.flatMap((file) => {
    const content = readFileSync(join(root, file), "utf8");
    return content
      .split("\n")
      .map((line, index) => ({ index: index + 1, line }))
      .filter(({ line }) => frenchCopyPattern.test(line) && !ignoredLinePatterns.some((pattern) => pattern.test(line.trim())))
      .map(({ index, line }) => `${relative(root, join(root, file))}:${index}: ${line.trim()}`);
  });

  assert.deepEqual(offenders, []);
});
