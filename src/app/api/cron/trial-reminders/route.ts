import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

// Retired: the trial is now usage-based (5 talks, no time limit), so there is no
// 14-day expiry window to remind users about. The route stays mounted and keeps
// the CRON_SECRET auth guard so any still-scheduled call resolves cleanly with a
// 200 instead of erroring. Safe to delete the schedule entirely.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, retired: true });
}
