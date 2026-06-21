import assert from "node:assert/strict";
import test from "node:test";
import {
  buildOnboardingDashboardRecommendations,
  getGuidedTalkSuggestion,
  getOnboardingAssistantFeatureSettings,
  getOnboardingDefaultTalkType
} from "./personalization";

const pastorProfile = {
  speaker_role: "pastor",
  primary_talk_type: "sermon",
  onboarding_help_requested: true,
  onboarding_support_note: "Je veux un setup simple."
} as const;

test("pastor onboarding defaults to sermon with bible suggestions", () => {
  assert.equal(getOnboardingDefaultTalkType(pastorProfile), "sermon");
  assert.deepEqual(getOnboardingAssistantFeatureSettings(pastorProfile), {
    extraEnabledFeatures: ["suggest-bible"]
  });
});

test("guided talk suggestion adapts to founder profile", () => {
  const suggestion = getGuidedTalkSuggestion({
    speaker_role: "founder",
    primary_talk_type: "pitch",
    onboarding_help_requested: false,
    onboarding_support_note: ""
  });

  assert.equal(suggestion.type, "pitch");
  assert.match(suggestion.titlePlaceholder, /vision/i);
  assert.match(suggestion.briefPlaceholder, /problème/i);
});

test("dashboard recommendations include contextual help when requested", () => {
  const recommendations = buildOnboardingDashboardRecommendations(pastorProfile, []);

  assert.equal(recommendations.some((item) => item.id === "guided-first-talk"), true);
  assert.equal(recommendations.some((item) => item.id === "onboarding-help"), true);
});
