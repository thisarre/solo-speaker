import { DashboardPageView } from "@/app/dashboard/page";
import { getLocaleFromParams, type LocaleParams } from "@/i18n/server";

export default async function LocalizedDashboardPage({ params }: { params: LocaleParams }) {
  const locale = await getLocaleFromParams(params);
  return <DashboardPageView locale={locale} />;
}
