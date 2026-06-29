import assert from "node:assert/strict";
import test from "node:test";
import { getPasswordPolicyError, scorePassword } from "./password-strength";

test("scorePassword grades by length and character variety", () => {
  assert.equal(scorePassword("").strength, "weak");
  assert.equal(scorePassword("test1234").strength, "weak"); // 8 chars, lower + digit only
  assert.equal(scorePassword("Test1234").strength, "medium"); // adds uppercase
  assert.equal(scorePassword("Test1234!").strength, "strong"); // adds a symbol
  assert.equal(scorePassword("Sunrise7Path").strength, "strong"); // 12 chars, mixed case + digit
});

test("scorePassword treats common and email-derived passwords as weak", () => {
  assert.equal(scorePassword("password1").strength, "weak");
  assert.equal(scorePassword("12345678").strength, "weak");
  assert.equal(scorePassword("aaaaaaaa").strength, "weak");
  assert.equal(scorePassword("Thierno2026", "thierno@example.com").strength, "weak");
});

test("getPasswordPolicyError reports the first failing rule", () => {
  assert.equal(getPasswordPolicyError("short7!"), "min");
  assert.equal(getPasswordPolicyError("abcdefghij"), "lettersNumbers");
  assert.equal(getPasswordPolicyError("password1"), "common");
  assert.equal(getPasswordPolicyError("test1234"), "weak");
  assert.equal(getPasswordPolicyError("Test1234"), null);
  assert.equal(getPasswordPolicyError("Sunrise7Path"), null);
});
