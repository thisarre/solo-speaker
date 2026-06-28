import { Sidebar } from "./Sidebar";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { getProfile, getUser } from "@/modules/auth/queries";
import { GuidedOnboardingTour } from "@/modules/onboarding/components/guided-onboarding-tour";
import { OnboardingPreferenceSync } from "@/modules/onboarding/components/onboarding-preference-sync";
import { getTrialReminder } from "@/modules/billing/trial";
import { getLatestTalkId, getTalkCount } from "@/modules/talks/queries";
import { PostHogIdentify } from "@/components/analytics/PostHogIdentify";
import { HelpAssistantWidget } from "@/modules/help/components/help-assistant-widget";
import { getMessages } from "@/i18n/messages";
import { defaultLocale, isLocale, type Locale } from "@/i18n/routing";

export async function AppShell({ children, locale }: { children: ReactNode; locale?: Locale }) {
  const [profile, talkCount, latestTalkId, user] = await Promise.all([getProfile(), getTalkCount(), getLatestTalkId(), getUser()]);
  const headerLocale = (await headers()).get("x-locale") ?? undefined;
  const activeLocale = locale ?? (isLocale(headerLocale) ? headerLocale : defaultLocale);
  const messages = getMessages(activeLocale);
  const billingPlan = profile?.billing_plan ?? "trial";
  const trialReminder = billingPlan === "studio" || billingPlan === "team"
    ? null
    : getTrialReminder({ copy: messages.trial, trialStartedAt: profile?.created_at ?? null });

  return (
    <div className="flex min-h-[100svh] bg-bg text-ink">
      {user ? <PostHogIdentify email={user.email} name={profile?.full_name ?? undefined} userId={user.id} /> : null}
      <OnboardingPreferenceSync profile={profile} />
      <GuidedOnboardingTour enabled={Boolean(profile?.onboarding_completed_at)} latestTalkId={latestTalkId} />
      <Sidebar locale={activeLocale} talkCount={talkCount} trialReminder={trialReminder} userName={profile?.full_name ?? messages.common.brandShort} />
      <main className="min-w-0 flex-1 pb-[76px] md:pb-0">{children}</main>
      <HelpAssistantWidget />
    </div>
  );
}
