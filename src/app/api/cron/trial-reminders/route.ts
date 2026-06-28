import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { renderTrialReminderEmail } from "@/lib/email/templates";

export const runtime = "nodejs";

const TRIAL_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

// Daily cron: emails trial users whose 14-day trial is about to end, at two
// milestones — "d3" (~3 days left) and "d1" (~1 day left) — exactly once each.
// Protected by CRON_SECRET (Authorization: Bearer <secret>).
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = Date.now();

  // Only trial users created 11–14 days ago (trial ends within ~3 days).
  const { data: candidates, error } = await admin
    .from("profiles")
    .select("id, full_name, created_at, trial_reminders_sent")
    .eq("billing_plan", "trial")
    .gte("created_at", new Date(now - TRIAL_DAYS * DAY_MS).toISOString())
    .lte("created_at", new Date(now - (TRIAL_DAYS - 3) * DAY_MS).toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const profile of candidates ?? []) {
    const elapsedDays = Math.floor((now - new Date(profile.created_at).getTime()) / DAY_MS);
    const remaining = TRIAL_DAYS - elapsedDays;
    const already = profile.trial_reminders_sent ?? [];

    let milestone: "d3" | "d1" | null = null;
    if (remaining <= 1 && remaining > 0 && !already.includes("d1")) milestone = "d1";
    else if (remaining <= 3 && remaining > 1 && !already.includes("d3")) milestone = "d3";
    if (!milestone) continue;

    const { data: userData } = await admin.auth.admin.getUserById(profile.id);
    const user = userData?.user;
    if (!user?.email) continue;
    const metaName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;

    const result = await sendEmail({
      to: user.email,
      ...renderTrialReminderEmail({ name: profile.full_name ?? metaName, daysLeft: Math.max(1, remaining) })
    });

    if (result.sent) {
      await admin.from("profiles").update({ trial_reminders_sent: [...already, milestone] }).eq("id", profile.id);
      sent += 1;
    }
  }

  return NextResponse.json({ ok: true, candidates: candidates?.length ?? 0, sent });
}
