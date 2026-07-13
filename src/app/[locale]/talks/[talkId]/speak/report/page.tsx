import { RehearsalReportPageView } from "@/app/talks/[talkId]/speak/report/page";
import { getLocaleFromParams, type LocaleParams } from "@/i18n/server";

type Props = {
  params: Promise<{ locale: string; talkId: string }>;
  searchParams: Promise<{ session?: string }>;
};

export default async function LocalizedRehearsalReportPage({ params, searchParams }: Props) {
  const locale = await getLocaleFromParams(params as unknown as LocaleParams);
  return (
    <RehearsalReportPageView
      params={params as unknown as Promise<{ talkId: string }>}
      searchParams={searchParams}
      locale={locale}
    />
  );
}
