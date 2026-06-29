import assert from "node:assert/strict";
import test from "node:test";
import { isAuthorized, parseCommand } from "./commands";

test("isAuthorized matches only the configured owner id", () => {
  assert.equal(isAuthorized(123, "123"), true);
  assert.equal(isAuthorized("123", "123"), true);
  assert.equal(isAuthorized(999, "123"), false);
  assert.equal(isAuthorized(123, ""), false);
  assert.equal(isAuthorized(123, undefined), false);
  assert.equal(isAuthorized(undefined, "123"), false);
});

test("parseCommand treats plain text as a coding task", () => {
  assert.deepEqual(parseCommand("corrige le bug du bouton"), { type: "task", prompt: "corrige le bug du bouton" });
  assert.deepEqual(parseCommand("/code add a dark mode toggle"), { type: "task", prompt: "add a dark mode toggle" });
});

test("parseCommand recognizes control commands", () => {
  assert.deepEqual(parseCommand("/help"), { type: "help" });
  assert.deepEqual(parseCommand("/start"), { type: "help" });
  assert.deepEqual(parseCommand("/status"), { type: "status" });
  assert.deepEqual(parseCommand("/merge 42"), { type: "merge", pr: 42 });
  assert.deepEqual(parseCommand("/merge #42"), { type: "merge", pr: 42 });
});

test("parseCommand ignores empty input and unknown slash commands", () => {
  assert.deepEqual(parseCommand(""), { type: "ignore" });
  assert.deepEqual(parseCommand("   "), { type: "ignore" });
  assert.deepEqual(parseCommand("/unknown thing"), { type: "ignore" });
  assert.deepEqual(parseCommand("/code   "), { type: "help" });
});
