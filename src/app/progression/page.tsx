import { headers } from "next/headers";
import { AppShell } from "@/components/layout/AppShell";
import { ProgressionPage } from "@/modules/progression/components/progression-page";
import { getTalks } from "@/modules/talks/queries";
import { calculateGlobalProgression } from "@/modules/progression/utils/calculate-global-progression";
import type { Locale } from "@/i18n/routing";
import { resolveServerLocale } from "@/i18n/server";

export default async function GlobalProgressionPage() {
  return <GlobalProgressionPageView />;
}

export async function GlobalProgressionPageView({ locale: routeLocale }: { locale?: Locale } = {}) {
  const talks = await getTalks();
  const locale = resolveServerLocale((await headers()).get("x-locale"), routeLocale);

  return (
    <AppShell locale={locale}>
      <ProgressionPage report={calculateGlobalProgression(talks, locale)} />
    </AppShell>
  );
}
