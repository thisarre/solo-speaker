import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { extractTaskText, isAuthorizedSlackUser, verifySlackSignature } from "./verify";

const SECRET = "test-signing-secret";
const NOW_MS = 1_700_000_000_000;
const TS = String(Math.floor(NOW_MS / 1000));

function sign(rawBody: string, ts = TS): string {
  return `v0=${createHmac("sha256", SECRET).update(`v0:${ts}:${rawBody}`).digest("hex")}`;
}

test("verifySlackSignature accepts a valid signature", () => {
  const body = '{"type":"event_callback"}';
  assert.equal(verifySlackSignature({ signingSecret: SECRET, timestamp: TS, signature: sign(body), rawBody: body, nowMs: NOW_MS }), true);
});

test("verifySlackSignature rejects tampered body, wrong secret and missing parts", () => {
  const body = '{"a":1}';
  assert.equal(verifySlackSignature({ signingSecret: SECRET, timestamp: TS, signature: sign(body), rawBody: '{"a":2}', nowMs: NOW_MS }), false);
  assert.equal(verifySlackSignature({ signingSecret: "other", timestamp: TS, signature: sign(body), rawBody: body, nowMs: NOW_MS }), false);
  assert.equal(verifySlackSignature({ signingSecret: SECRET, timestamp: TS, signature: null, rawBody: body, nowMs: NOW_MS }), false);
  assert.equal(verifySlackSignature({ signingSecret: undefined, timestamp: TS, signature: sign(body), rawBody: body, nowMs: NOW_MS }), false);
});

test("verifySlackSignature rejects stale timestamps (replay)", () => {
  const body = "{}";
  const staleTs = String(Math.floor(NOW_MS / 1000) - 600);
  assert.equal(verifySlackSignature({ signingSecret: SECRET, timestamp: staleTs, signature: sign(body, staleTs), rawBody: body, nowMs: NOW_MS }), false);
});

test("isAuthorizedSlackUser matches the allowlist", () => {
  assert.equal(isAuthorizedSlackUser("U1", "U1,U2"), true);
  assert.equal(isAuthorizedSlackUser("U3", "U1,U2"), false);
  assert.equal(isAuthorizedSlackUser("U1", ""), false);
  assert.equal(isAuthorizedSlackUser(undefined, "U1"), false);
});

test("extractTaskText strips bot mentions", () => {
  assert.equal(extractTaskText("<@U123> corrige le bug"), "corrige le bug");
  assert.equal(extractTaskText("ajoute un mode sombre"), "ajoute un mode sombre");
  assert.equal(extractTaskText("<@U1> <@U2>   "), "");
});
