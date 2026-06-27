import assert from "node:assert/strict";
import test from "node:test";
import { getMessages } from "@/i18n/messages";
import { buildHelpAssistantPrompt, getRelevantHelpActions, parseHelpAssistantReply } from "./help-assistant";

test("getRelevantHelpActions guides password reset questions to the recovery screen", () => {
  const actions = getRelevantHelpActions("J'ai oublié mon mot de passe", "fr", getMessages("fr").helpAssistant);

  assert.equal(actions[0]?.href, "/fr/forgot-password");
  assert.equal(actions[0]?.label, "Réinitialiser le mot de passe");
});

test("buildHelpAssistantPrompt includes app guidance and current page context", () => {
  const prompt = buildHelpAssistantPrompt({
    copy: getMessages("en").helpAssistant,
    currentPath: "/en/talks/new",
    locale: "en",
    question: "How do I create my first talk?"
  });

  assert.match(prompt, /Current page: \/en\/talks\/new/);
  assert.match(prompt, /create a new talk/);
  assert.match(prompt, /Reply in English/);
});

test("parseHelpAssistantReply keeps a safe fallback when the model returns invalid JSON", () => {
  assert.deepEqual(parseHelpAssistantReply("not json", "Fallback answer"), {
    answer: "Fallback answer",
    followUp: ""
  });
});
