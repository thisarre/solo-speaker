import { NextResponse, type NextRequest } from "next/server";
import { sendEmail } from "@/lib/email/send";
import { renderBrowserReportEmail } from "@/lib/email/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BrowserResultBody = {
  passed?: number;
  failed?: number;
  total?: number;
  failures?: { title?: string; error?: string }[];
};

// Receives the daily Playwright run summary from CI and emails it to the owner.
// Protected by CRON_SECRET (Authorization: Bearer <secret>).
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: BrowserResultBody;
  try {
    body = (await request.json()) as BrowserResultBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const passed = Number(body.passed) || 0;
  const failed = Number(body.failed) || 0;
  const total = Number(body.total) || passed + failed;
  const failures = Array.isArray(body.failures)
    ? body.failures.slice(0, 20).map((failure) => ({ title: String(failure?.title ?? "test"), error: String(failure?.error ?? "failed") }))
    : [];

  const recipient = process.env.HEALTH_REPORT_TO?.trim() || process.env.EMAIL_FROM?.trim() || "contact@solospeaker.com";
  const dateLabel = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });

  const result = await sendEmail({ to: recipient, ...renderBrowserReportEmail({ passed, failed, total, failures, dateLabel }) });
  return NextResponse.json({ ok: true, emailed: result.sent, passed, failed, total });
}
