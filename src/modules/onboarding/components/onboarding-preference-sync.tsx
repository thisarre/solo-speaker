"use client";

import { useEffect } from "react";
import { applyAssistantFeatureSettingsDefaults } from "@/modules/assistant/feature-settings";
import { getOnboardingAssistantFeatureSettings, type OnboardingProfile } from "@/modules/onboarding/personalization";

export function OnboardingPreferenceSync({ profile }: { profile?: OnboardingProfile | null }) {
  useEffect(() => {
    applyAssistantFeatureSettingsDefaults(getOnboardingAssistantFeatureSettings(profile));
  }, [profile]);

  return null;
}
