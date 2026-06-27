import assert from "node:assert/strict";
import test from "node:test";
import { resolveServerLocale } from "./server";

test("resolveServerLocale prefers an explicit route locale over a missing or stale header", () => {
  assert.equal(resolveServerLocale("en", "fr"), "fr");
  assert.equal(resolveServerLocale(undefined, "fr"), "fr");
});

test("resolveServerLocale falls back to the header locale and then the default locale", () => {
  assert.equal(resolveServerLocale("fr"), "fr");
  assert.equal(resolveServerLocale("de"), "en");
  assert.equal(resolveServerLocale(undefined), "en");
});
