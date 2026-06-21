import Link from "next/link";
import type { ReactNode } from "react";
import { CheckCircle2, Clock3, FileText, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { TalkCard } from "@/components/talks/TalkCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getTalks } from "@/modules/talks/queries";
import { talkTypeLabels, type TalkType } from "@/types/talk";

type TalksSearchParams = {
  type?: string;
};

const filters: Array<{ label: string; type?: TalkType }> = [
  { label: "Tous" },
  { label: talkTypeLabels.sermon, type: "sermon" },
  { label: talkTypeLabels.conference, type: "conference" },
  { label: talkTypeLabels.training, type: "training" },
  { label: talkTypeLabels.pitch, type: "pitch" },
  { label: talkTypeLabels.speech, type: "speech" }
];

function isTalkType(value: string | undefined): value is TalkType {
  return value === "sermon" || value === "conference" || value === "training" || value === "pitch" || value === "speech";
}

export default async function TalksPage({ searchParams }: { searchParams?: Promise<TalksSearchParams> }) {
  const params = await searchParams;
  const activeType = isTalkType(params?.type) ? params.type : undefined;
  const talks = await getTalks();
  const filteredTalks = activeType ? talks.filter((talk) => talk.type === activeType) : talks;
  const readyTalks = talks.filter((talk) => talk.status === "ready").length;
  const draftTalks = talks.filter((talk) => talk.status === "draft").length;
  const totalMinutes = talks.reduce((total, talk) => total + talk.durationMinutes, 0);
  const filterCounts = new Map<TalkType | "all", number>([
    ["all", talks.length],
    ["sermon", talks.filter((talk) => talk.type === "sermon").length],
    ["conference", talks.filter((talk) => talk.type === "conference").length],
    ["training", talks.filter((talk) => talk.type === "training").length],
    ["pitch", talks.filter((talk) => talk.type === "pitch").length],
    ["speech", talks.filter((talk) => talk.type === "speech").length]
  ]);

  return (
    <AppShell>
      <div className="studio-scroll h-screen overflow-y-auto bg-background px-5 pb-28 pt-7 md:px-10 md:py-8">
        <div className="mx-auto w-full max-w-[1180px]">
          <PageHeader
            title="Talks"
            description="Retrouvez vos brouillons, vos talks prêts et les idées à transformer en prise de parole."
            actions={
              <Link href="/talks/new?guided=1" data-tour="create-talk">
                <Button leftIcon={<Plus />} variant="primary">Créer un talk</Button>
              </Link>
            }
          />

          <section className="mt-6 grid gap-3 sm:grid-cols-3">
            <TalkMetric icon={<FileText />} label="Dans le studio" value={talks.length} detail={`${draftTalks} brouillon${draftTalks > 1 ? "s" : ""}`} />
            <TalkMetric icon={<CheckCircle2 />} label="Prêts" value={readyTalks} detail="À présenter" />
            <TalkMetric icon={<Clock3 />} label="Temps préparé" value={`${totalMinutes} min`} detail="Hors archives" />
          </section>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filters.map((filter) => {
            const active = filter.type === activeType || (!filter.type && !activeType);
            const count = filterCounts.get(filter.type ?? "all") ?? 0;

            return (
            <Link
              className={`studio-chip inline-flex shrink-0 items-center gap-2 rounded-[8px] border px-3 py-1.5 font-[550] ${
                active ? "border-line bg-surface text-ink shadow-[0_1px_2px_rgba(20,20,25,.05)]" : "border-transparent text-mute hover:bg-surface hover:text-ink"
              }`}
              href={filter.type ? `/talks?type=${filter.type}` : "/talks"}
              key={filter.label}
            >
              {filter.label}
              <span className={`rounded-[5px] px-1.5 py-0.5 font-mono text-[10px] ${active ? "bg-panel text-faint" : "bg-surface text-faint"}`}>{count}</span>
            </Link>
          );
          })}
          </div>

          {filteredTalks.length ? (
            <div className="mt-5 grid gap-3.5 md:grid-cols-2 xl:grid-cols-3" data-tour="talks-list">
              {filteredTalks.map((talk) => (
                <TalkCard key={talk.id} talk={talk} />
              ))}
              <Link
                className="flex min-h-[184px] flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed border-line bg-panel/40 text-[13px] font-medium text-mute transition hover:border-faint hover:bg-surface hover:text-ink"
                href="/talks/new?guided=1"
              >
                <Plus className="size-5 opacity-70" />
                Créer un talk
              </Link>
            </div>
          ) : (
            <div className="mt-5" data-tour="talks-list">
              <EmptyState
                action={
                  <Link href="/talks/new?guided=1" data-tour="create-talk">
                    <Button variant="primary">Créer un talk</Button>
                  </Link>
                }
                icon={<Plus />}
                title={activeType ? `Aucun ${talkTypeLabels[activeType].toLowerCase()}` : "Aucun talk"}
                description={activeType ? "Changez de filtre ou créez un nouveau talk dans cette catégorie." : "Commencez avec un sermon, une conférence, une formation, un pitch ou un discours."}
              />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function TalkMetric({ icon, label, value, detail }: { icon: ReactNode; label: string; value: number | string; detail: string }) {
  return (
    <article className="rounded-[12px] border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(20,20,25,.03)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">{label}</p>
        <div className="flex size-8 items-center justify-center rounded-[8px] bg-panel text-faint [&_svg]:size-4">{icon}</div>
      </div>
      <p className="m-0 text-[24px] font-semibold tracking-[0] text-foreground">{value}</p>
      <p className="m-0 mt-1 text-[12px] text-muted">{detail}</p>
    </article>
  );
}
