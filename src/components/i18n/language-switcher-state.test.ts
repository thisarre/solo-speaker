import assert from "node:assert/strict";
import test from "node:test";
import { getLanguageSwitcherOption, resolveLanguageSwitcherLocale } from "./LanguageSwitcher";

test("resolveLanguageSwitcherLocale follows the current localized pathname for the visual toggle", () => {
  assert.equal(resolveLanguageSwitcherLocale("/fr/dashboard", "en"), "fr");
  assert.equal(resolveLanguageSwitcherLocale("/en/pricing", "fr"), "en");
});

test("resolveLanguageSwitcherLocale falls back to the provided locale on unlocalized paths", () => {
  assert.equal(resolveLanguageSwitcherLocale("/dashboard", "fr"), "fr");
});

test("getLanguageSwitcherOption exposes a flag and short label for each language", () => {
  assert.deepEqual(getLanguageSwitcherOption("en"), { flag: "🇬🇧", label: "EN" });
  assert.deepEqual(getLanguageSwitcherOption("fr"), { flag: "🇫🇷", label: "FR" });
});
