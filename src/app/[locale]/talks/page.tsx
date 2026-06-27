import { TalksPageView } from "@/app/talks/page";
import { getLocaleFromParams, type LocaleParams } from "@/i18n/server";

type LocalizedTalksPageProps = {
  params: LocaleParams;
  searchParams?: Promise<{ type?: string }>;
};

export default async function LocalizedTalksPage({ params, searchParams }: LocalizedTalksPageProps) {
  const locale = await getLocaleFromParams(params);
  return <TalksPageView locale={locale} searchParams={searchParams} />;
}
