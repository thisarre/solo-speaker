import assert from "node:assert/strict";
import test from "node:test";
import { getMessages } from "@/i18n/messages";
import { canCreateTalk, trialTalkLimit } from "./entitlements";

test("canCreateTalk caps trial users at five talks", () => {
  assert.equal(trialTalkLimit, 5);
  assert.equal(canCreateTalk({ currentTalkCount: 4, plan: "trial" }).allowed, true);
  assert.deepEqual(canCreateTalk({ currentTalkCount: 5, plan: "trial" }), {
    allowed: false,
    reason: getMessages("fr").errors.trialTalkLimit
  });
});

test("canCreateTalk keeps Studio unlimited", () => {
  assert.equal(canCreateTalk({ currentTalkCount: 32, plan: "studio" }).allowed, true);
});

test("canCreateTalk keeps Team unlimited", () => {
  assert.equal(canCreateTalk({ currentTalkCount: 32, plan: "team" }).allowed, true);
});
