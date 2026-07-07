import { headers } from "next/headers";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { getProfile } from "@/modules/auth/queries";
import { CancelSubscriptionButton } from "@/modules/billing/components/cancel-subscription-button";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/i18n/routing";
import { resolveServerLocale } from "@/i18n/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function BillingPage() {
  return <BillingPageView />;
}

export async function BillingPageView({ locale: routeLocale }: { locale?: Locale } = {}) {
  const profile = await getProfile();
  const locale = resolveServerLocale((await headers()).get("x-locale"), routeLocale);
  const copy = getMessages(locale).billing;

  const planLabels: Record<string, string> = {
    studio: "Studio",
    pro: "Pro",
    team: "Team",
  };

  type SubRow = {
    status: string;
    current_period_end: string | null;
    created_at: string;
  };

  let sub: SubRow | null = null;
  if (profile?.billing_plan && profile.billing_plan !== "trial") {
    const admin = createAdminClient();
    const { data } = await admin
      .from("subscriptions")
      .select("status, current_period_end, created_at")
      .eq("user_id", profile.id)
      .maybeSingle();
    sub = data ?? null;
  }

  const isCanceling = sub?.status === "canceling";
  const isActive =
    profile?.billing_plan !== "trial" &&
    sub !== null &&
    sub.status !== "canceled";

  const createdAt = sub?.created_at ? new Date(sub.created_at) : null;
  const daysSinceCreation = createdAt
    ? (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    : Infinity;
  const isWithin14Days = daysSinceCreation < 14;

  const endDate = sub?.current_period_end
    ? new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", { dateStyle: "long" }).format(
        new Date(sub.current_period_end)
      )
    : null;

  return (
    <AppShell locale={locale}>
      <div className="studio-scroll h-[100svh] overflow-x-hidden overflow-y-auto bg-background px-5 pb-28 pt-7 md:px-10 md:py-8">
        <div className="mx-auto w-full max-w-[1480px]">
          <PageHeader
            eyebrow={copy.eyebrow}
            title={copy.title}
            description={copy.description}
          />

          <div className="mt-6">
            <section className="rounded-[14px] border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(20,20,25,.03)] md:p-6">
              <p className="mb-4 font-mono text-[10px] uppercase tracking-[.12em] text-faint">
                {copy.currentPlan}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-[20px] font-semibold tracking-[0] text-foreground">
                    {profile?.billing_plan && profile.billing_plan !== "trial"
                      ? planLabels[profile.billing_plan] ?? profile.billing_plan
                      : "Free"}
                  </span>

                  {isCanceling ? (
                    <span className="rounded-[6px] border border-[color-mix(in_oklab,var(--danger)_30%,var(--border))] bg-[color-mix(in_oklab,var(--danger)_8%,transparent)] px-2 py-1 text-[11px] font-semibold text-[var(--danger)]">
                      {copy.scheduledCancellation}
                    </span>
                  ) : isActive ? (
                    <span className="rounded-[6px] border border-[color-mix(in_oklab,var(--ok)_30%,var(--border))] bg-[color-mix(in_oklab,var(--ok)_8%,transparent)] px-2 py-1 text-[11px] font-semibold text-ok">
                      {copy.activeLabel}
                    </span>
                  ) : null}
                </div>

                {isActive && !isCanceling ? (
                  <CancelSubscriptionButton
                    isWithin14Days={isWithin14Days}
                    periodEnd={sub?.current_period_end ?? null}
                  />
                ) : null}
              </div>

              {isCanceling && endDate ? (
                <p className="mt-3 text-[13px] leading-6 text-muted">
                  {copy.accessUntil.replace("{date}", endDate)}
                </p>
              ) : null}
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
