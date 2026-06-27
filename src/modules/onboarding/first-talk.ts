import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/i18n/routing";
import type { TalkType } from "@/types/talk";

type OnboardingFirstTalkDraftInput = {
  locale: Locale;
  type: TalkType;
  userId: string;
};

export function buildOnboardingFirstTalkDraft(input: OnboardingFirstTalkDraftInput) {
  const isFrench = input.locale === "fr";
  const copy = getMessages(input.locale).onboarding;

  return {
    section: {
      body: "",
      heading: copy.firstTalkSectionHeading,
      position: 0
    },
    talk: {
      audience: "",
      duration_minutes: 10,
      language: isFrench ? "FR" as const : "EN" as const,
      title: copy.firstTalkTitle,
      type: input.type,
      user_id: input.userId
    }
  };
}
