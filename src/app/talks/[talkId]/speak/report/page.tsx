import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ReportSummaryWidget } from "@/modules/speaking-mode/components/ReportSummaryWidget";
import { requireUser } from "@/modules/auth/queries";
import { createClient } from "@/lib/supabase/server";
import { wordCount } from "@/lib/utils";
import { getMessages } from "@/i18n/messages";
import { resolveServerLocale, type LocaleParams } from "@/i18n/server";
import { localizedPath, type Locale } from "@/i18n/routing";

type Props = {
  params: Promise<{ talkId: string }>;
  searchParams: Promise<{ session?: string }>;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function formatMinSec(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default async function RehearsalReportPage({ params, searchParams }: Props) {
  return <RehearsalReportPageView params={params} searchParams={searchParams} />;
}

export async function RehearsalReportPageView({
  params,
  searchParams,
  locale: routeLocale
}: Props & { locale?: Locale }) {
  const locale = resolveServerLocale((await headers()).get("x-locale"), routeLocale);
  const messages = getMessages(locale);
  const copy = messages.rehearsalReport;

  const [{ talkId }, { session: sessionId }] = await Promise.all([params, searchParams]);

  if (!talkId || !uuidPattern.test(talkId) || !sessionId || !uuidPattern.test(sessionId)) {
    notFound();
  }

  await requireUser();
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("rehearsal_sessions")
    .select("id, talk_id, talk_title, duration_seconds, estimated_seconds, ai_summary")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) notFound();

  let totalWords = 0;
  if (session.talk_id && session.talk_id === talkId) {
    const { data: sections } = await supabase
      .from("talk_sections")
      .select("heading, body")
      .eq("talk_id", session.talk_id);
    totalWords = (sections ?? []).reduce((sum, s) => sum + wordCount(s.heading) + wordCount(s.body), 0);
  }

  const wpm =
    totalWords > 0 && session.duration_seconds > 0
      ? Math.round((totalWords / session.duration_seconds) * 60)
      : null;
  const coveragePct =
    session.estimated_seconds && session.estimated_seconds > 0
      ? Math.min(100, Math.round((session.duration_seconds / session.estimated_seconds) * 100))
      : null;

  const speakPath = localizedPath(`/talks/${talkId}/speak`, locale);
  const analyticsPath = localizedPath("/analytics/rehearsal", locale);
  const talkTitle = session.talk_title ?? "—";

  return (
    <AppShell locale={locale}>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <p className="mb-1 text-[11px] uppercase tracking-[.09em] text-faint">{copy.title}</p>
        <h1 className="mb-8 text-[22px] font-semibold text-ink">{talkTitle}</h1>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetricCard
            label={copy.duration}
            value={formatMinSec(session.duration_seconds)}
            sub={session.estimated_seconds ? `${copy.durationTarget} ${formatMinSec(session.estimated_seconds)}` : undefined}
          />
          <MetricCard
            label={copy.pace}
            value={wpm !== null ? `${wpm}` : copy.na}
            sub={wpm !== null ? copy.paceUnit : undefined}
          />
          <MetricCard
            label={copy.coverage}
            value={coveragePct !== null ? `${coveragePct}%` : copy.na}
          />
        </div>

        <div className="mb-8">
          <ReportSummaryWidget sessionId={session.id} locale={locale} copy={copy} />
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={speakPath}
            className="inline-flex h-10 items-center rounded-lg bg-ink px-5 text-[14px] font-medium text-bg transition hover:opacity-90"
          >
            {copy.retry}
          </Link>
          <Link
            href={analyticsPath}
            className="inline-flex h-10 items-center rounded-lg border border-line px-5 text-[14px] font-medium text-ink transition hover:bg-panel"
          >
            {copy.history}
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-[10px] border border-line bg-panel p-4">
      <p className="mb-1 text-[11px] uppercase tracking-[.09em] text-faint">{label}</p>
      <p className="text-[24px] font-semibold leading-none text-ink">{value}</p>
      {sub ? <p className="mt-1 text-[12px] text-faint">{sub}</p> : null}
    </div>
  );
}
