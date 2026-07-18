import assert from "node:assert/strict";
import test from "node:test";
import { voiceMemoLanguageForLocale } from "@/modules/voice-memo/language";

test("le mémo vocal suit le locale réel de la session (audit 2026-07-18, UX-1)", () => {
  assert.equal(voiceMemoLanguageForLocale("fr"), "FR");
  assert.equal(voiceMemoLanguageForLocale("en"), "EN");
});

test("NewTalkForm ne code plus la langue du mémo en dur (garde de régression, UX-1)", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("./NewTalkForm.tsx", import.meta.url), "utf-8");
  assert.doesNotMatch(source, /language="FR"/, "langue du mémo codée en dur — régression UX-1");
  assert.match(source, /voiceMemoLanguageForLocale\(locale\)/);
});
