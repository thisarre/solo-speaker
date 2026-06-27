import { TalkPageView } from "@/app/talks/[talkId]/page";
import { getLocaleFromParams, type LocaleParams } from "@/i18n/server";

type LocalizedTalkPageProps = {
  params: Promise<{ locale: string; talkId: string }>;
};

export default async function LocalizedTalkPage({ params }: LocalizedTalkPageProps) {
  const locale = await getLocaleFromParams(params as LocaleParams);
  return <TalkPageView locale={locale} params={params} />;
}
