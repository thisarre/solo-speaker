import { SettingsPageView } from "@/app/settings/page";
import { getLocaleFromParams, type LocaleParams } from "@/i18n/server";

export default async function LocalizedSettingsPage({ params }: { params: LocaleParams }) {
  const locale = await getLocaleFromParams(params);
  return <SettingsPageView locale={locale} />;
}
