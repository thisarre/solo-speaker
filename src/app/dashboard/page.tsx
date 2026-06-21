import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ModularDashboard } from "@/modules/studio-layout/components/modular-dashboard";
import { getProfile } from "@/modules/auth/queries";
import { getTalks } from "@/modules/talks/queries";

export default async function DashboardPage() {
  const [profile, talks] = await Promise.all([getProfile(), getTalks()]);

  if (profile && !profile.onboarding_completed_at) {
    redirect("/onboarding");
  }

  return (
    <AppShell>
      <ModularDashboard profile={profile} talks={talks} />
    </AppShell>
  );
}
