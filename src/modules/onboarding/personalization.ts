import type { AssistantFeatureSettings } from "@/modules/assistant/feature-registry";
import type { AssistantFeature } from "@/modules/assistant/types";
import type { Talk, TalkType } from "@/types/talk";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/i18n/routing";

export type SpeakerRole = "pastor" | "conference_speaker" | "trainer" | "founder" | "speaker";

export type OnboardingProfile = {
  speaker_role: SpeakerRole;
  primary_talk_type: TalkType;
  onboarding_help_requested: boolean;
  onboarding_support_note: string;
};

export type OnboardingDashboardRecommendation = {
  id: string;
  title: string;
  message: string;
  actionLabel?: string;
  href?: string;
  tone?: "accent" | "help";
};

export type GuidedTalkSuggestion = {
  type: TalkType;
  roleLabel: string;
  titlePlaceholder: string;
  briefPlaceholder: string;
  message: string;
};

const roleTalkDefaults: Record<SpeakerRole, TalkType> = {
  pastor: "sermon",
  conference_speaker: "conference",
  trainer: "training",
  founder: "pitch",
  speaker: "conference"
};

export function getOnboardingDefaultTalkType(profile?: OnboardingProfile | null): TalkType {
  if (!profile) return "conference";
  return profile.primary_talk_type || roleTalkDefaults[profile.speaker_role] || "conference";
}

export function getOnboardingAssistantFeatureSettings(profile?: OnboardingProfile | null): AssistantFeatureSettings {
  const extraEnabledFeatures: AssistantFeature[] = [];

  if (profile?.speaker_role === "pastor" || profile?.primary_talk_type === "sermon") {
    extraEnabledFeatures.push("suggest-bible");
  }

  return { extraEnabledFeatures };
}

const fallbackLocale: Locale = "fr";

export function getGuidedTalkSuggestion(profile?: OnboardingProfile | null, locale: Locale = fallbackLocale): GuidedTalkSuggestion {
  const onboarding = getMessages(locale).onboarding;
  const role = profile?.speaker_role ?? "speaker";
  const type = getOnboardingDefaultTalkType(profile);
  const guide = onboarding.guidedTalkByRole[role];
  const roleLabel = onboarding.roleLabels[role];

  return {
    type,
    roleLabel,
    titlePlaceholder: guide[0],
    briefPlaceholder: guide[1],
    message: onboarding.guidedTalkMessage.replace("{role}", roleLabel)
  };
}

export function buildOnboardingDashboardRecommendations(profile: OnboardingProfile | null | undefined, talks: Talk[], locale: Locale = fallbackLocale): OnboardingDashboardRecommendation[] {
  const copy = getMessages(locale).onboarding.dashboardRecommendations;
  const recommendations: OnboardingDashboardRecommendation[] = [];
  const suggestion = getGuidedTalkSuggestion(profile, locale);

  if (!talks.length) {
    recommendations.push({
      id: "guided-first-talk",
      title: copy.guidedFirstTalk[0],
      message: copy.guidedFirstTalk[1].replace("{type}", suggestion.type).replace("{role}", suggestion.roleLabel),
      actionLabel: copy.guidedFirstTalk[2],
      href: "/talks/new?guided=1",
      tone: "accent"
    });
  }

  if (profile?.onboarding_help_requested) {
    recommendations.push({
      id: "onboarding-help",
      title: copy.onboardingHelp[0],
      message: profile.onboarding_support_note
        ? copy.onboardingHelpNote.replace("{note}", profile.onboarding_support_note)
        : copy.onboardingHelp[1],
      actionLabel: copy.onboardingHelp[2],
      href: "mailto:support@solo-speaker.app?subject=Besoin%20d'aide%20Solo%20Speaker",
      tone: "help"
    });
  }

  if (profile?.speaker_role === "pastor" && profile.primary_talk_type !== "sermon") {
    recommendations.push({
      id: "pastor-bible-module",
      title: copy.pastorBibleModule[0],
      message: copy.pastorBibleModule[1],
      actionLabel: copy.pastorBibleModule[2],
      href: "/settings",
      tone: "accent"
    });
  }

  return recommendations.slice(0, 3);
}
