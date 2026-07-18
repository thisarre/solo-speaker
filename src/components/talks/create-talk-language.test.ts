import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("createTalk ne code plus la langue du talk en dur (classe UX-1, découvert en appliquant UX-4)", async () => {
  const source = await readFile(new URL("../../modules/talks/actions.ts", import.meta.url), "utf-8");
  assert.doesNotMatch(source, /language:\s*"FR"\s*\}/, "langue du talk codée en dur côté serveur");
  assert.match(source, /language:\s*locale === "en" \? "EN" : "FR"/);
});
