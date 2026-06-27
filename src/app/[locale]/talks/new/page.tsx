import { NewTalkPageView, type NewTalkSearchParams } from "@/app/talks/new/page";
import { getLocaleFromParams, type LocaleParams } from "@/i18n/server";

type LocalizedNewTalkPageProps = {
  params: LocaleParams;
  searchParams: Promise<NewTalkSearchParams>;
};

export default async function LocalizedNewTalkPage({ params, searchParams }: LocalizedNewTalkPageProps) {
  const locale = await getLocaleFromParams(params);
  return <NewTalkPageView locale={locale} searchParams={searchParams} />;
}
