import { RehearsalAnalyticsPageView } from "@/app/analytics/rehearsal/page";
import { getLocaleFromParams, type LocaleParams } from "@/i18n/server";

export default async function LocalizedRehearsalAnalyticsPage({ params }: { params: LocaleParams }) {
  const locale = await getLocaleFromParams(params);
  return <RehearsalAnalyticsPageView locale={locale} />;
}
