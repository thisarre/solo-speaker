import { Sidebar } from "./Sidebar";
import type { ReactNode } from "react";
import { getProfile } from "@/modules/auth/queries";
import { GuidedOnboardingTour } from "@/modules/onboarding/components/guided-onboarding-tour";
import { OnboardingPreferenceSync } from "@/modules/onboarding/components/onboarding-preference-sync";
import { getLatestTalkId, getTalkCount } from "@/modules/talks/queries";

export async function AppShell({ children }: { children: ReactNode }) {
  const [profile, talkCount, latestTalkId] = await Promise.all([getProfile(), getTalkCount(), getLatestTalkId()]);

  return (
    <div className="flex min-h-screen bg-bg text-ink">
      <OnboardingPreferenceSync profile={profile} />
      <GuidedOnboardingTour enabled={Boolean(profile?.onboarding_completed_at)} latestTalkId={latestTalkId} />
      <Sidebar talkCount={talkCount} userName={profile?.full_name ?? "Speaker"} />
      <main className="min-w-0 flex-1 pb-[76px] md:pb-0">{children}</main>
    </div>
  );
}
