"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, FileText, Mic2, Plus, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { TalkCard } from "@/components/talks/TalkCard";
import { talkStatusLabels, talkTypeLabels, type Talk } from "@/types/talk";
import type { DashboardWidgetId } from "./types";

export const dashboardWidgetLabels: Record<DashboardWidgetId, string> = {
  "resume-talk": "Talk à reprendre",
  "recent-talks": "Talks récents",
  "quick-actions": "Raccourcis",
  "preparation-summary": "Préparation",
  "status-distribution": "Répartition par statut",
  "type-distribution": "Répartition par type"
};

export type DashboardWidgetData = {
  activeTalks: Talk[];
  archivedTalks: Talk[];
  currentTalk?: Talk;
  draftTalks: Talk[];
  readyTalks: Talk[];
  statusRows: { count: number; label: string }[];
  talks: Talk[];
  totalMinutes: number;
  totalSections: number;
  typeCounts: { count: number; label: string; type: string }[];
};

export function renderDashboardWidget(id: DashboardWidgetId, data: DashboardWidgetData) {
  const registry: Record<DashboardWidgetId, ReactNode> = {
    "resume-talk": <ResumeTalkWidget data={data} />,
    "recent-talks": <RecentTalksWidget data={data} />,
    "quick-actions": <QuickActionsWidget />,
    "preparation-summary": <PreparationSummaryWidget data={data} />,
    "status-distribution": <StatusDistributionWidget data={data} />,
    "type-distribution": <TypeDistributionWidget data={data} />
  };

  return registry[id];
}

function ResumeTalkWidget({ data }: { data: DashboardWidgetData }) {
  const { currentTalk } = data;

  if (!currentTalk) {
    return (
      <EmptyState
        action={
          <Link href="/talks/new">
            <Button leftIcon={<Plus />} variant="primary">Créer un talk</Button>
          </Link>
        }
        icon={<Plus />}
        title="Aucun talk pour le moment"
        description="Créez votre premier talk pour préparer, améliorer et répéter une prise de parole."
      />
    );
  }

  return (
    <Card className="flex flex-wrap items-center gap-6 p-5 md:p-6">
      <div className="min-w-60 flex-1">
        <span className="rounded-md bg-accent-bg px-2 py-1 font-mono text-[10px] uppercase tracking-[.09em] text-accent-ink">
          Prochain travail · {talkTypeLabels[currentTalk.type]}
        </span>
        <h2 className="mb-1.5 mt-2.5 text-[20px] font-semibold tracking-[0]">{currentTalk.title}</h2>
        <div className="flex flex-wrap gap-3.5 font-mono text-[11px] text-faint">
          <span>{currentTalk.durationMinutes} min</span>
          <span>{currentTalk.audience || "Audience à préciser"}</span>
          <span>{currentTalk.updatedAtLabel}</span>
        </div>
      </div>
      <div className="w-full min-w-[150px] md:w-[190px]">
        <div className="mb-2 flex justify-between gap-2 font-mono text-[10.5px] text-faint">
          <span>Préparation</span>
          <span>{currentTalk.sections.length}</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-line2">
          <div className="h-full rounded-full bg-accent" style={{ width: `${getTalkReadinessPercent(currentTalk)}%` }} />
        </div>
      </div>
      <div className="flex gap-2">
        <Link href={`/talks/${currentTalk.id}`}>
          <Button variant="primary">Éditer</Button>
        </Link>
        <Link href={`/talks/${currentTalk.id}/speak`}>
          <Button leftIcon={<Mic2 />} variant="ghost">Répéter</Button>
        </Link>
      </div>
    </Card>
  );
}

function RecentTalksWidget({ data }: { data: DashboardWidgetData }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="m-0 text-sm font-semibold tracking-[0]">Talks récents</h2>
        <Link className="flex items-center gap-1 text-[12.5px] text-mute hover:text-ink" href="/talks">
          Voir tout <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        {data.talks.length ? (
          data.talks.slice(0, 3).map((talk) => <TalkCard key={talk.id} talk={talk} />)
        ) : (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState
              action={
                <Link href="/talks/new">
                  <Button leftIcon={<Plus />} variant="primary">Créer un talk</Button>
                </Link>
              }
              icon={<Plus />}
              title="Aucun talk récent"
              description="Vos derniers brouillons et talks prêts apparaîtront ici."
            />
          </div>
        )}
      </div>
    </section>
  );
}

function QuickActionsWidget() {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-sm font-semibold tracking-[0]">Raccourcis</h2>
        <span className="font-mono text-[10.5px] text-faint">Studio</span>
      </div>
      <div className="grid gap-2">
        <Link href="/talks/new">
          <Button className="w-full justify-start" leftIcon={<Plus />} variant="ghost">Créer un talk</Button>
        </Link>
        <Link href="/talks">
          <Button className="w-full justify-start" leftIcon={<FileText />} variant="ghost">Voir les talks</Button>
        </Link>
        <Link href="/progression">
          <Button className="w-full justify-start" leftIcon={<Wand2 />} variant="quiet">Voir la progression</Button>
        </Link>
      </div>
    </Card>
  );
}

function PreparationSummaryWidget({ data }: { data: DashboardWidgetData }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-sm font-semibold tracking-[0]">Préparation</h2>
        <span className="font-mono text-[10.5px] text-faint">{data.talks.length} talks</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <PreparationStat label="Prêts" value={data.readyTalks.length} />
        <PreparationStat label="À finaliser" value={data.draftTalks.length} />
        <PreparationStat label="Temps" value={`${data.totalMinutes}m`} />
      </div>
    </Card>
  );
}

function StatusDistributionWidget({ data }: { data: DashboardWidgetData }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-sm font-semibold tracking-[0]">Statuts</h2>
        <span className="font-mono text-[10.5px] text-faint">{data.talks.length} talks</span>
      </div>
      <div className="grid gap-2">
        {data.statusRows.map((row) => (
          <DashboardBar count={row.count} key={row.label} label={row.label} total={Math.max(1, data.talks.length)} />
        ))}
      </div>
    </Card>
  );
}

function TypeDistributionWidget({ data }: { data: DashboardWidgetData }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-sm font-semibold tracking-[0]">Types</h2>
        <span className="font-mono text-[10.5px] text-faint">{data.totalSections} sections</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {data.typeCounts.map((item) => (
          <Link
            className="rounded-[7px] border border-line bg-bg px-2 py-1 text-[11.5px] font-[550] text-mute transition hover:bg-panel hover:text-ink"
            href={`/talks?type=${item.type}`}
            key={item.type}
          >
            {item.label} · {item.count}
          </Link>
        ))}
      </div>
    </Card>
  );
}

export function DashboardMetric({ detail, icon, label, value }: { detail: string; icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <Card className="p-4 transition hover:border-faint">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[.12em] text-faint">{label}</span>
        <span className="flex size-8 items-center justify-center rounded-[8px] bg-panel text-mute [&_svg]:size-4">{icon}</span>
      </div>
      <p className="m-0 text-[28px] font-semibold leading-none tracking-[0] text-ink">{value}</p>
      <p className="m-0 mt-2 text-[12.5px] leading-5 text-mute">{detail}</p>
    </Card>
  );
}

function PreparationStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-[8px] border border-line2 bg-bg px-2.5 py-2">
      <p className="m-0 font-mono text-[10px] uppercase tracking-[.08em] text-faint">{label}</p>
      <p className="m-0 mt-1 text-[16px] font-semibold leading-none text-ink">{value}</p>
    </div>
  );
}

function DashboardBar({ count, label, total }: { count: number; label: string; total: number }) {
  const width = `${Math.round((count / total) * 100)}%`;

  return (
    <div>
      <div className="mb-1 flex justify-between gap-3 text-[12px] text-mute">
        <span>{label}</span>
        <span className="font-mono text-[10.5px] text-faint">{count}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-line2">
        <div className="h-full rounded-full bg-accent" style={{ width }} />
      </div>
    </div>
  );
}

function getTalkReadinessPercent(talk: Talk) {
  const sectionScore = Math.min(1, talk.sections.length / 4) * 42;
  const audienceScore = talk.audience ? 18 : 0;
  const statusScore = talk.status === "ready" ? 40 : talk.status === "draft" ? 16 : 0;
  return Math.max(8, Math.round(sectionScore + audienceScore + statusScore));
}

export function buildDashboardWidgetData(talks: Talk[]): DashboardWidgetData {
  const activeTalks = talks.filter((talk) => talk.status !== "archived");
  const readyTalks = talks.filter((talk) => talk.status === "ready");
  const draftTalks = talks.filter((talk) => talk.status === "draft");
  const archivedTalks = talks.filter((talk) => talk.status === "archived");
  const totalMinutes = talks.reduce((total, talk) => total + talk.durationMinutes, 0);
  const totalSections = talks.reduce((total, talk) => total + talk.sections.length, 0);
  const typeCounts = Object.entries(talkTypeLabels).map(([type, label]) => ({
    type,
    label,
    count: talks.filter((talk) => talk.type === type).length
  }));
  const statusRows = [
    { label: talkStatusLabels.draft, count: draftTalks.length },
    { label: talkStatusLabels.ready, count: readyTalks.length },
    { label: talkStatusLabels.archived, count: archivedTalks.length }
  ];

  return {
    activeTalks,
    archivedTalks,
    currentTalk: talks[0],
    draftTalks,
    readyTalks,
    statusRows,
    talks,
    totalMinutes,
    totalSections,
    typeCounts
  };
}
