import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ModularDashboard } from "@/modules/studio-layout/components/modular-dashboard";
import { CheckoutSync } from "@/modules/billing/components/checkout-sync";
import { getProfile } from "@/modules/auth/queries";
import { getTalks } from "@/modules/talks/queries";
import { localizedPath, type Locale } from "@/i18n/routing";

export default async function DashboardPage() {
  return <DashboardPageView />;
}

export async function DashboardPageView({ locale }: { locale?: Locale } = {}) {
  const [profile, talks] = await Promise.all([getProfile(), getTalks()]);

  if (profile && !profile.onboarding_completed_at) {
    redirect(localizedPath("/onboarding", locale ?? "en"));
  }

  return (
    <AppShell locale={locale}>
      <Suspense>
        <CheckoutSync />
      </Suspense>
      <ModularDashboard profile={profile} talks={talks} />
    </AppShell>
  );
}
