import { headers } from "next/headers";
import { AppShell } from "@/components/layout/AppShell";
import { RehearsalDashboard } from "@/modules/analytics/components/rehearsal-dashboard";
import { RehearsalLocked } from "@/modules/analytics/components/rehearsal-locked";
import { getProfile } from "@/modules/auth/queries";
import { getRehearsalSessions } from "@/modules/analytics/queries";
import { getTalks } from "@/modules/talks/queries";
import { can } from "@/modules/billing/capabilities";
import type { BillingPlan } from "@/modules/billing/entitlements";
import { getMessages } from "@/i18n/messages";
import { resolveServerLocale } from "@/i18n/server";
import type { Locale } from "@/i18n/routing";

export default async function RehearsalAnalyticsPage() {
  return <RehearsalAnalyticsPageView />;
}

export async function RehearsalAnalyticsPageView({ locale: routeLocale }: { locale?: Locale } = {}) {
  const locale = resolveServerLocale((await headers()).get("x-locale"), routeLocale);
  const messages = getMessages(locale);
  const profile = await getProfile();
  const plan = (profile?.billing_plan ?? "trial") as BillingPlan;

  if (!can(plan, "analytics.rehearsal")) {
    return (
      <AppShell locale={locale}>
        <RehearsalLocked messages={messages.analytics} locale={locale} />
      </AppShell>
    );
  }

  const [sessions, talks] = await Promise.all([getRehearsalSessions(), getTalks()]);
  const talkOptions = talks.map((t) => ({ id: t.id, title: t.title }));

  return (
    <AppShell locale={locale}>
      <RehearsalDashboard
        messages={messages.analytics}
        sessions={sessions}
        talkOptions={talkOptions}
        locale={locale}
      />
    </AppShell>
  );
}
