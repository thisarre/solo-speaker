import assert from "node:assert/strict";
import test from "node:test";
import {
  addLocaleToPath,
  getLocalizedPathAlternates,
  getPathWithoutLocale,
  isLocale,
  localizedPath,
  pickLocaleFromPath
} from "./routing";

test("isLocale accepts only supported locales", () => {
  assert.equal(isLocale("en"), true);
  assert.equal(isLocale("fr"), true);
  assert.equal(isLocale("de"), false);
});

test("pickLocaleFromPath reads the leading locale segment", () => {
  assert.equal(pickLocaleFromPath("/fr/pricing"), "fr");
  assert.equal(pickLocaleFromPath("/en/dashboard"), "en");
  assert.equal(pickLocaleFromPath("/pricing"), null);
});

test("localizedPath preserves query strings and swaps locale prefixes", () => {
  assert.equal(localizedPath("/pricing?plan=studio", "fr"), "/fr/pricing?plan=studio");
  assert.equal(localizedPath("/en/login?next=/dashboard", "fr"), "/fr/login?next=/dashboard");
  assert.equal(localizedPath("/fr/signup", "en"), "/en/signup");
});

test("getPathWithoutLocale removes only a supported locale prefix", () => {
  assert.equal(getPathWithoutLocale("/fr/settings"), "/settings");
  assert.equal(getPathWithoutLocale("/en"), "/");
  assert.equal(getPathWithoutLocale("/pricing"), "/pricing");
});

test("getLocalizedPathAlternates returns reciprocal hreflang paths", () => {
  assert.deepEqual(getLocalizedPathAlternates("/pricing"), {
    en: "/en/pricing",
    fr: "/fr/pricing",
    "x-default": "/en/pricing"
  });
});

test("addLocaleToPath keeps API and auth callback paths unlocalized", () => {
  assert.equal(addLocaleToPath("/api/ai/generate", "fr"), "/api/ai/generate");
  assert.equal(addLocaleToPath("/auth/callback", "fr"), "/auth/callback");
  assert.equal(addLocaleToPath("/dashboard", "fr"), "/fr/dashboard");
});
