import { notFound } from "next/navigation";
import { SpeakingMode } from "@/modules/speaking-mode";
import { getTalkById } from "@/modules/talks/queries";

type SpeakPageProps = {
  params: Promise<{ talkId: string }>;
};

export default async function SpeakPage({ params }: SpeakPageProps) {
  const { talkId } = await params;
  const talk = await getTalkById(talkId);

  if (!talk) {
    notFound();
  }

  return <SpeakingMode talk={talk} />;
}
