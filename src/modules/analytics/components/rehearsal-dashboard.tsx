"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Messages } from "@/i18n/messages";
import type { RehearsalSession } from "@/modules/analytics/queries";

type TalkOption = { id: string; title: string };

type Props = {
  messages: Messages["analytics"];
  sessions: RehearsalSession[];
  talkOptions: TalkOption[];
  locale: string;
};

function formatDuration(seconds: number, minutesUnit: string): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}${minutesUnit}`;
  return `${m}${minutesUnit}`;
}

function precisionScore(durationSeconds: number, estimatedSeconds: number | null): number | null {
  if (!estimatedSeconds || estimatedSeconds <= 0) return null;
  return Math.max(0, 1 - Math.abs(durationSeconds - estimatedSeconds) / estimatedSeconds);
}

function isoWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-line bg-panel p-4">
      <p className="mb-1 text-[11px] uppercase tracking-[.09em] text-faint">{label}</p>
      <p className="text-[22px] font-semibold leading-none text-ink">{value}</p>
    </div>
  );
}

function DurationBarChart({
  sessions,
  actualLabel,
  estimatedLabel,
  minutesUnit
}: {
  sessions: RehearsalSession[];
  actualLabel: string;
  estimatedLabel: string;
  minutesUnit: string;
}) {
  const recent = sessions.slice(-20);
  const maxSeconds = Math.max(
    ...recent.flatMap((s) => [s.durationSeconds, s.estimatedSeconds ?? 0]),
    60
  );
  const W = 560;
  const H = 140;
  const padL = 36;
  const padB = 22;
  const plotW = W - padL - 8;
  const plotH = H - padB - 8;
  const n = recent.length;
  const groupW = plotW / n;
  const barW = Math.min(14, groupW * 0.38);
  const gap = 3;

  function barY(seconds: number) {
    return 8 + plotH * (1 - seconds / maxSeconds);
  }
  function barH(seconds: number) {
    return plotH * (seconds / maxSeconds);
  }

  const yLabels = [0, Math.round(maxSeconds / 60 / 2), Math.round(maxSeconds / 60)];

  return (
    <div>
      <div className="mb-2 flex items-center gap-4 text-[11px] text-faint">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-[#7b79ff]/40" />
          {estimatedLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-[#7b79ff]" />
          {actualLabel}
        </span>
      </div>
      <svg className="w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        {yLabels.map((v, i) => {
          const y = i === 0 ? 8 + plotH : i === 1 ? 8 + plotH / 2 : 8;
          return (
            <g key={i}>
              <line x1={padL} x2={W - 8} y1={y} y2={y} stroke="currentColor" strokeOpacity={0.08} strokeWidth={1} />
              <text x={padL - 4} y={y + 3} fontSize={9} fill="currentColor" fillOpacity={0.4} textAnchor="end">
                {v}{minutesUnit}
              </text>
            </g>
          );
        })}

        {recent.map((s, i) => {
          const cx = padL + i * groupW + groupW / 2;
          const estX = cx - barW - gap / 2;
          const actX = cx + gap / 2;
          const date = new Date(s.startedAt);
          const label = `${date.getDate()}/${date.getMonth() + 1}`;

          return (
            <g key={s.id}>
              {s.estimatedSeconds ? (
                <rect
                  x={estX}
                  y={barY(s.estimatedSeconds)}
                  width={barW}
                  height={barH(s.estimatedSeconds)}
                  fill="#7b79ff"
                  fillOpacity={0.3}
                  rx={2}
                />
              ) : null}
              <rect
                x={actX}
                y={barY(s.durationSeconds)}
                width={barW}
                height={barH(s.durationSeconds)}
                fill="#7b79ff"
                rx={2}
              />
              <text
                x={cx}
                y={H - 4}
                fontSize={8}
                fill="currentColor"
                fillOpacity={0.35}
                textAnchor="middle"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ActivityHeatmap({
  sessions,
  dayLabels
}: {
  sessions: RehearsalSession[];
  dayLabels: string[];
}) {
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sessions) {
      const k = s.startedAt.slice(0, 10);
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return map;
  }, [sessions]);

  const weeks = 16;
  const today = new Date();
  const startMonday = isoWeekMonday(new Date(today.getTime() - (weeks - 1) * 7 * 86400000));

  const cells: { k: string; count: number; future: boolean }[] = [];
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(startMonday);
      cellDate.setDate(startMonday.getDate() + w * 7 + d);
      const k = dateKey(cellDate);
      cells.push({
        k,
        count: sessionsByDate.get(k) ?? 0,
        future: cellDate > today
      });
    }
  }

  function cellStyle(count: number, future: boolean): React.CSSProperties {
    if (future) return { backgroundColor: "transparent" };
    if (count === 0) return { backgroundColor: "var(--line)" };
    if (count === 1) return { backgroundColor: "color-mix(in oklch, var(--accent) 28%, var(--bg))" };
    if (count === 2) return { backgroundColor: "color-mix(in oklch, var(--accent) 55%, var(--bg))" };
    return { backgroundColor: "color-mix(in oklch, var(--accent) 82%, var(--bg))" };
  }

  return (
    <div className="flex gap-2">
      <div className="flex flex-col justify-between pt-[0px] pb-[0px]" style={{ gap: "3px" }}>
        {dayLabels.map((d, i) => (
          <div key={i} className="flex h-[13px] items-center text-[9px] text-faint">{d}</div>
        ))}
      </div>
      <div
        className="grid"
        style={{ gridTemplateRows: "repeat(7, 13px)", gridAutoFlow: "column", gap: "3px" }}
      >
        {cells.map((cell, i) => (
          <div
            key={i}
            title={cell.future ? "" : `${cell.k}: ${cell.count}`}
            className="rounded-[2px]"
            style={{ width: "13px", height: "13px", ...cellStyle(cell.count, cell.future) }}
          />
        ))}
      </div>
    </div>
  );
}

function PrecisionTrend({ sessions }: { sessions: RehearsalSession[] }) {
  const scored = useMemo(
    () =>
      sessions
        .filter((s) => s.estimatedSeconds && s.estimatedSeconds > 0)
        .slice(-20)
        .map((s) => ({ ...s, score: precisionScore(s.durationSeconds, s.estimatedSeconds)! })),
    [sessions]
  );

  if (scored.length < 2) return null;

  const W = 560;
  const H = 90;
  const padL = 30;
  const padB = 16;
  const plotW = W - padL - 8;
  const plotH = H - padB - 8;
  const n = scored.length;

  function px(i: number) {
    return padL + (i / (n - 1)) * plotW;
  }
  function py(score: number) {
    return 8 + plotH * (1 - score);
  }

  const points = scored.map((s, i) => `${px(i)},${py(s.score)}`).join(" ");

  return (
    <svg className="w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      <line x1={padL} x2={W - 8} y1={8} y2={8} stroke="currentColor" strokeOpacity={0.06} strokeWidth={1} />
      <line x1={padL} x2={W - 8} y1={8 + plotH / 2} y2={8 + plotH / 2} stroke="currentColor" strokeOpacity={0.06} strokeWidth={1} />
      <line x1={padL} x2={W - 8} y1={8 + plotH} y2={8 + plotH} stroke="currentColor" strokeOpacity={0.06} strokeWidth={1} />

      <text x={padL - 4} y={11} fontSize={9} fill="currentColor" fillOpacity={0.4} textAnchor="end">100%</text>
      <text x={padL - 4} y={8 + plotH / 2 + 3} fontSize={9} fill="currentColor" fillOpacity={0.4} textAnchor="end">50%</text>
      <text x={padL - 4} y={8 + plotH + 3} fontSize={9} fill="currentColor" fillOpacity={0.4} textAnchor="end">0%</text>

      <polyline
        points={points}
        fill="none"
        stroke="#7b79ff"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {scored.map((s, i) => (
        <circle key={s.id} cx={px(i)} cy={py(s.score)} r={3} fill="#7b79ff" />
      ))}
    </svg>
  );
}

export function RehearsalDashboard({ messages, sessions, talkOptions, locale }: Props) {
  const [filterTalkId, setFilterTalkId] = useState<string>("");
  const [filterFrom, setFilterFrom] = useState<string>("");
  const [filterTo, setFilterTo] = useState<string>("");

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (filterTalkId && s.talkId !== filterTalkId) return false;
      if (filterFrom && s.startedAt.slice(0, 10) < filterFrom) return false;
      if (filterTo && s.startedAt.slice(0, 10) > filterTo) return false;
      return true;
    });
  }, [sessions, filterTalkId, filterFrom, filterTo]);

  const stats = useMemo(() => {
    const totalTime = filtered.reduce((acc, s) => acc + s.durationSeconds, 0);
    const scoredSessions = filtered.filter((s) => s.estimatedSeconds && s.estimatedSeconds > 0);
    const avgPrecision =
      scoredSessions.length > 0
        ? scoredSessions.reduce((acc, s) => acc + (precisionScore(s.durationSeconds, s.estimatedSeconds) ?? 0), 0) /
          scoredSessions.length
        : null;
    const mon = isoWeekMonday(new Date());
    const thisWeekCount = filtered.filter((s) => {
      const d = new Date(s.startedAt);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 7);
      return d >= mon && d < sun;
    }).length;
    return { totalTime, avgPrecision, thisWeekCount };
  }, [filtered]);

  const hasFilters = Boolean(filterTalkId || filterFrom || filterTo);

  const sessionCountLabel = messages.sessionCount
    .replace("{count}", String(filtered.length))
    .replace("{plural}", filtered.length !== 1 ? "s" : "");

  return (
    <div className="px-6 py-10 md:px-10 md:py-12">
      <div className="mb-8">
        <h1 className="mb-1 text-[22px] font-semibold tracking-[-0.01em] text-ink">{messages.title}</h1>
        <p className="text-[14px] text-mute">{messages.subtitle}</p>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        {talkOptions.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-[.09em] text-faint">{messages.filterTalk}</label>
            <select
              className="h-8 rounded-[8px] border border-line bg-panel px-3 text-[13px] text-ink focus:outline-none focus:ring-1 focus:ring-accent"
              value={filterTalkId}
              onChange={(e) => setFilterTalkId(e.target.value)}
            >
              <option value="">{messages.filterAllTalks}</option>
              {talkOptions.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-[.09em] text-faint">{messages.filterFrom}</label>
          <input
            type="date"
            className="h-8 rounded-[8px] border border-line bg-panel px-3 text-[13px] text-ink focus:outline-none focus:ring-1 focus:ring-accent"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-[.09em] text-faint">{messages.filterTo}</label>
          <input
            type="date"
            className="h-8 rounded-[8px] border border-line bg-panel px-3 text-[13px] text-ink focus:outline-none focus:ring-1 focus:ring-accent"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
          />
        </div>
        {hasFilters && (
          <button
            className="h-8 rounded-[8px] border border-line bg-panel px-3 text-[13px] text-mute transition hover:text-ink"
            onClick={() => { setFilterTalkId(""); setFilterFrom(""); setFilterTo(""); }}
            type="button"
          >
            {messages.resetFilters}
          </button>
        )}
        <p className="ml-auto text-[12px] text-faint">{sessionCountLabel}</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label={messages.totalSessions} value={String(filtered.length)} />
        <StatCard
          label={messages.totalTime}
          value={filtered.length > 0 ? formatDuration(stats.totalTime, messages.minutesUnit) : "—"}
        />
        <StatCard
          label={messages.avgPrecision}
          value={stats.avgPrecision !== null ? `${Math.round(stats.avgPrecision * 100)}%` : "—"}
        />
        <StatCard label={messages.thisWeek} value={String(stats.thisWeekCount)} />
      </div>

      {filtered.length === 0 && sessions.length === 0 ? (
        <div className="rounded-[12px] border border-line bg-surface p-10 text-center">
          <p className="mb-2 text-[15px] font-medium text-ink">{messages.emptyTitle}</p>
          <p className="mb-6 text-[13px] leading-5 text-mute">{messages.emptyBody}</p>
          <Link
            href={`/${locale}/talks`}
            className="inline-flex items-center rounded-[8px] border border-line bg-panel px-4 py-2 text-[13px] font-medium text-mute transition hover:text-ink"
          >
            {messages.goRehearse}
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[12px] border border-line bg-surface p-8 text-center">
          <p className="text-[14px] text-mute">{messages.noDataPeriod}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[12px] border border-line bg-surface p-5">
            <p className="mb-4 text-[12.5px] font-medium text-mute">{messages.barChartTitle}</p>
            <DurationBarChart
              sessions={filtered}
              actualLabel={messages.barChartActual}
              estimatedLabel={messages.barChartEstimated}
              minutesUnit={messages.minutesUnit}
            />
          </div>

          <div className="rounded-[12px] border border-line bg-surface p-5">
            <p className="mb-4 text-[12.5px] font-medium text-mute">{messages.heatmapTitle}</p>
            <ActivityHeatmap sessions={filtered} dayLabels={messages.heatmapDays} />
          </div>

          {filtered.filter((s) => s.estimatedSeconds && s.estimatedSeconds > 0).length >= 2 && (
            <div className="rounded-[12px] border border-line bg-surface p-5 md:col-span-2">
              <p className="mb-4 text-[12.5px] font-medium text-mute">{messages.trendTitle}</p>
              <PrecisionTrend sessions={filtered} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
