"use client";

import { useEffect, useState } from "react";
import type { Messages } from "@/i18n/messages";

type Props = {
  sessionId: string;
  locale: string;
  copy: Messages["rehearsalReport"];
};

export function ReportSummaryWidget({ sessionId, locale, copy }: Props) {
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/analytics/rehearsal/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, locale })
    })
      .then((r) => r.json())
      .then((data: { ok?: boolean; summary?: string }) => {
        if (!cancelled) {
          if (data.ok && data.summary) setSummary(data.summary);
          else setError(true);
        }
      })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [sessionId, locale]);

  return (
    <div className="rounded-[10px] border border-line bg-panel p-5">
      <p className="mb-3 text-[11px] uppercase tracking-[.09em] text-faint">{copy.aiSummary}</p>
      {summary ? (
        <p className="text-[15px] leading-relaxed text-ink">{summary}</p>
      ) : error ? (
        <p className="text-[14px] text-faint">{copy.aiError}</p>
      ) : (
        <div className="flex items-center gap-2 text-[14px] text-faint">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {copy.aiLoading}
        </div>
      )}
    </div>
  );
}
