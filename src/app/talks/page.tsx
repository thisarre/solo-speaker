import Link from "next/link";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { CheckCircle2, Clock3, FileText, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { TalkCard } from "@/components/talks/TalkCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getTalks } from "@/modules/talks/queries";
import type { TalkType } from "@/types/talk";
import { getMessages } from "@/i18n/messages";
import { localizedPath, type Locale } from "@/i18n/routing";
import { resolveServerLocale } from "@/i18n/server";

type TalksSearchParams = {
  type?: string;
};

function isTalkType(value: string | undefined): value is TalkType {
  return value === "sermon" || value === "conference" || value === "training" || value === "pitch" || value === "speech";
}

function formatCount(template: string, count: number) {
  return template
    .replace("{count}", String(count))
    .replace("{plural}", count > 1 ? "s" : "");
}

export default async function TalksPage({ searchParams }: { searchParams?: Promise<TalksSearchParams> }) {
  return <TalksPageView searchParams={searchParams} />;
}

export async function TalksPageView({ searchParams, locale: routeLocale }: { searchParams?: Promise<TalksSearchParams>; locale?: Locale }) {
  const params = await searchParams;
  const locale = resolveServerLocale((await headers()).get("x-locale"), routeLocale);
  const messages = getMessages(locale);
  const copy = messages.talks;
  const filters: Array<{ label: string; type?: TalkType }> = [
    { label: copy.all },
    { label: copy.types.sermon, type: "sermon" },
    { label: copy.types.conference, type: "conference" },
    { label: copy.types.training, type: "training" },
    { label: copy.types.pitch, type: "pitch" },
    { label: copy.types.speech, type: "speech" }
  ];
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
    <AppShell locale={locale}>
      <div className="studio-scroll h-[100svh] overflow-x-hidden overflow-y-auto bg-background px-5 pb-28 pt-7 md:px-10 md:py-8">
        <div className="mx-auto w-full max-w-[1480px]">
          <PageHeader
            title={copy.title}
            description={copy.description}
            actions={
              <Link href={localizedPath("/talks/new?guided=1", locale)} data-tour="create-talk">
                <Button leftIcon={<Plus />} variant="primary">{messages.common.createTalk}</Button>
              </Link>
            }
          />

          <section className="mt-6 grid gap-3 sm:grid-cols-3">
            <TalkMetric icon={<FileText />} label={copy.inStudio} value={talks.length} detail={formatCount(copy.draftCount, draftTalks)} />
            <TalkMetric icon={<CheckCircle2 />} label={messages.dashboard.ready} value={readyTalks} detail={copy.toPresent} />
            <TalkMetric icon={<Clock3 />} label={copy.preparedTime} value={`${totalMinutes} min`} detail={copy.outsideArchives} />
          </section>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filters.map((filter) => {
            const active = filter.type === activeType || (!filter.type && !activeType);
            const count = filterCounts.get(filter.type ?? "all") ?? 0;

            return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`studio-chip inline-flex shrink-0 items-center gap-2 rounded-[8px] border px-3 py-1.5 font-[550] ${
                active ? "border-accent bg-accent-muted text-accent-ink shadow-[0_1px_2px_rgba(20,20,25,.05)]" : "border-transparent text-mute hover:bg-surface hover:text-ink"
              }`}
              href={filter.type ? localizedPath(`/talks?type=${filter.type}`, locale) : localizedPath("/talks", locale)}
              key={filter.label}
            >
              {filter.label}
              <span className={`rounded-[5px] px-1.5 py-0.5 font-mono text-[10px] ${active ? "bg-surface text-accent-ink" : "bg-surface text-faint"}`}>{count}</span>
            </Link>
          );
          })}
          </div>

          {filteredTalks.length ? (
            <div className="mt-5 grid gap-3.5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" data-tour="talks-list">
              {filteredTalks.map((talk) => (
                <TalkCard key={talk.id} talk={talk} />
              ))}
              <Link
                className="flex min-h-[184px] flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed border-line bg-panel/40 text-[13px] font-medium text-mute transition hover:border-faint hover:bg-surface hover:text-ink"
                href={localizedPath("/talks/new?guided=1", locale)}
              >
                <Plus className="size-5 opacity-70" />
                {messages.common.createTalk}
              </Link>
            </div>
          ) : (
            <div className="mt-5" data-tour="talks-list">
              <EmptyState
                action={
                  <Link href={localizedPath("/talks/new?guided=1", locale)} data-tour="create-talk">
                    <Button variant="primary">{messages.common.createTalk}</Button>
                  </Link>
                }
                icon={<Plus />}
                title={activeType ? copy.emptyFilteredTitle.replace("{type}", copy.types[activeType].toLowerCase()) : copy.emptyTitle}
                description={activeType ? copy.emptyFilteredDescription : copy.emptyDescription}
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
