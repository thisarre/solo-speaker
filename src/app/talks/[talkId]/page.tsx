import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { TalkEditor } from "@/components/talks/TalkEditor";
import { getTalkById } from "@/modules/talks/queries";
import type { Locale } from "@/i18n/routing";

type TalkPageProps = {
  params: Promise<{ talkId: string }>;
};

export default async function TalkPage({ params }: TalkPageProps) {
  return <TalkPageView params={params} />;
}

export async function TalkPageView({ params, locale }: TalkPageProps & { locale?: Locale }) {
  const { talkId } = await params;
  const talk = await getTalkById(talkId);

  if (!talk) {
    notFound();
  }

  return (
    <AppShell locale={locale}>
      <TalkEditor talk={talk} />
    </AppShell>
  );
}
