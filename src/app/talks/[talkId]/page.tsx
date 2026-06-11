import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { TalkEditor } from "@/components/talks/TalkEditor";
import { getTalkById } from "@/modules/talks/queries";

type TalkPageProps = {
  params: Promise<{ talkId: string }>;
};

export default async function TalkPage({ params }: TalkPageProps) {
  const { talkId } = await params;
  const talk = await getTalkById(talkId);

  if (!talk) {
    notFound();
  }

  return (
    <AppShell>
      <TalkEditor talk={talk} />
    </AppShell>
  );
}
