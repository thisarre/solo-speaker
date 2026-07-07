import { BillingPageView } from "@/app/account/billing/page";
import { getLocaleFromParams, type LocaleParams } from "@/i18n/server";

export default async function LocalizedBillingPage({ params }: { params: LocaleParams }) {
  const locale = await getLocaleFromParams(params);
  return <BillingPageView locale={locale} />;
}
