import { NextResponse, type NextRequest } from "next/server";
import { sendEmail } from "@/lib/email/send";
import { renderHealthReportEmail } from "@/lib/email/templates";
import { runHealthChecks } from "@/modules/monitoring/health-checks";
import { fetchRecentErrors } from "@/modules/monitoring/posthog-errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Daily cron: probes the live site, builds a health report and emails it to the
// site owner. Protected by CRON_SECRET (Authorization: Bearer <secret>).
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://solospeaker.com").replace(/\/+$/, "");
  const recipient = process.env.HEALTH_REPORT_TO?.trim() || process.env.EMAIL_FROM?.trim() || "contact@solospeaker.com";

  const [report, errors] = await Promise.all([
    runHealthChecks(baseUrl),
    fetchRecentErrors({
      apiHost: process.env.POSTHOG_API_HOST,
      projectId: process.env.POSTHOG_PROJECT_ID,
      apiKey: process.env.POSTHOG_PERSONAL_API_KEY,
      sinceHours: 24
    })
  ]);
  const dateLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris"
  });

  const result = await sendEmail({ to: recipient, ...renderHealthReportEmail({ report, dateLabel, errors }) });

  return NextResponse.json({
    ok: true,
    healthy: report.summary.healthy,
    summary: report.summary,
    jsErrors: errors,
    emailed: result.sent,
    recipient,
    results: report.results.map((r) => ({ name: r.name, level: r.level, status: r.status, durationMs: r.durationMs, issues: r.issues }))
  });
}
