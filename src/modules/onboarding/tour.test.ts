import assert from "node:assert/strict";
import test from "node:test";
import { getOnboardingTourProgress, getRestartedOnboardingTourState, getStepIndexForPath, onboardingTourSteps, resolveOnboardingTourStepHref } from "./tour";

test("guided onboarding starts by creating the first talk and walks through the core workflow", () => {
  assert.equal(onboardingTourSteps[0].href, "/talks/new?guided=1&welcome=1");
  assert.deepEqual(onboardingTourSteps.map((step) => step.id), [
    "new-talk",
    "editor",
    "prompter",
    "dashboard",
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

test("tour progress recognizes the first guided talk screen as the first step", () => {
  assert.equal(getStepIndexForPath("/talks/new", 4), 0);
  assert.equal(getStepIndexForPath("/dashboard", 0), 3);
});
