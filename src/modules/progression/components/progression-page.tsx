import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlobalReadinessCard } from "./global-readiness-card";
import { ProgressionMetricsGrid } from "./progression-metrics-grid";
import { ProgressionRecommendations } from "./progression-recommendations";
import { ReadyTalksList } from "./ready-talks-list";
import { StatusDistributionCard } from "./status-distribution-card";
import { TalkDiagnosticList } from "./talk-diagnostic-list";
import { TalksToFinishList } from "./talks-to-finish-list";
import { TypeDistributionCard } from "./type-distribution-card";
import type { GlobalProgressionReport } from "@/modules/progression/types";
import { useI18n } from "@/i18n/client";
import { localizedPath } from "@/i18n/routing";

export function ProgressionPage({ report }: { report: GlobalProgressionReport }) {
  const { locale, messages } = useI18n();
  const copy = messages.progression;
  const lowScoreTalks = report.readiness.filter((r) => !r.isArchived && r.score < 70);

  return (
    <main className="studio-scroll h-[100svh] min-w-0 overflow-y-auto overflow-x-hidden px-6 py-8 md:px-11">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-[30px] font-semibold leading-tight tracking-[0] text-ink">{copy.title}</h1>
          <p className="m-0 mt-1 text-[14px] leading-6 text-mute">{copy.subtitle}</p>
        </div>
        <Link href={localizedPath("/talks/new", locale)}>
          <Button leftIcon={<Plus />} variant="primary">{copy.createTalk}</Button>
        </Link>
      </header>

      {report.readiness.length ? (
        <>
          <div className="mt-7">
            <ProgressionMetricsGrid metrics={report.metrics} />
          </div>

          {lowScoreTalks.length > 0 && (
            <div className="mt-5">
              <TalkDiagnosticList talks={lowScoreTalks} />
            </div>
          )}

          <section className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]">
            <div className="grid min-w-0 gap-5">
              <GlobalReadinessCard report={report} />
              <StatusDistributionCard rows={report.statusDistribution} />
              <TypeDistributionCard rows={report.typeDistribution} />
            </div>
            <div className="grid min-w-0 gap-5">
              <TalksToFinishList talks={report.toFinish} />
              <ReadyTalksList talks={report.readyToPresent} />
              <ProgressionRecommendations recommendations={report.recommendations} />
            </div>
          </section>
        </>
      ) : (
        <div className="mt-7">
          <EmptyState
            action={
              <Link href={localizedPath("/talks/new", locale)}>
                <Button leftIcon={<Plus />} variant="primary">{copy.createTalk}</Button>
              </Link>
            }
            icon={<Plus />}
            title={copy.emptyTitle}
            description={copy.emptyBody}
          />
        </div>
      )}
    </main>
  );
}
