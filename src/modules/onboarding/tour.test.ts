import assert from "node:assert/strict";
import test from "node:test";
import { getOnboardingTourProgress, getRestartedOnboardingTourState, onboardingTourSteps, resolveOnboardingTourStepHref } from "./tour";

test("guided onboarding starts on the dashboard and walks through the core workflow", () => {
  assert.equal(onboardingTourSteps[0].href, "/dashboard");
  assert.deepEqual(onboardingTourSteps.map((step) => step.id), [
    "dashboard",
    "new-talk",
    "editor",
    "prompter",
    "settings"
  ]);
  assert.equal(onboardingTourSteps.every((step) => step.target), true);
});

test("tour progress clamps invalid stored indexes", () => {
  assert.equal(getOnboardingTourProgress(-4), 0);
  assert.equal(getOnboardingTourProgress(99), onboardingTourSteps.length - 1);
});

test("tour can be restarted on demand", () => {
  assert.deepEqual(getRestartedOnboardingTourState(), {
    completed: false,
    stepIndex: 0
  });
});

test("prompter step links to the latest talk speaking screen when available", () => {
  const prompterStep = onboardingTourSteps.find((step) => step.id === "prompter");
  assert.equal(resolveOnboardingTourStepHref(prompterStep!, { latestTalkId: "talk-123" }), "/talks/talk-123/speak");
});
