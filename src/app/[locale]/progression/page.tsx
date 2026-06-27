import { GlobalProgressionPageView } from "@/app/progression/page";
import { getLocaleFromParams, type LocaleParams } from "@/i18n/server";

export default async function LocalizedProgressionPage({ params }: { params: LocaleParams }) {
  const locale = await getLocaleFromParams(params);
  return <GlobalProgressionPageView locale={locale} />;
}
