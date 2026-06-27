import assert from "node:assert/strict";
import test from "node:test";
import { getHelpAssistantWidgetState } from "./help-assistant-widget-state";

test("getHelpAssistantWidgetState marks the closed assistant as ready", () => {
  assert.deepEqual(getHelpAssistantWidgetState({ hasUserMessage: false, isOpen: false, isPending: false }), {
    activity: "ready",
    shouldShowQuickQuestions: false,
    shouldShowTyping: false
  });
});

test("getHelpAssistantWidgetState shows quick questions before the first user message", () => {
  assert.deepEqual(getHelpAssistantWidgetState({ hasUserMessage: false, isOpen: true, isPending: false }), {
    activity: "listening",
    shouldShowQuickQuestions: true,
    shouldShowTyping: false
  });
});

test("getHelpAssistantWidgetState shows typing while waiting for a response", () => {
  assert.deepEqual(getHelpAssistantWidgetState({ hasUserMessage: true, isOpen: true, isPending: true }), {
    activity: "thinking",
    shouldShowQuickQuestions: false,
    shouldShowTyping: true
  });
});
