import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const STALE_MS = 10 * 60 * 1000; // TTL (60s) + generous margin

// Daily cron: flips abandoned 'reserved' STT sessions (no confirm received) to 'expired'.
// Conservative: it KEEPS reserved_seconds as the charge (only changes status; does NOT release
// the usage counter), so the cap is never under-counted. Protected by CRON_SECRET.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - STALE_MS).toISOString();
  const { data: stale } = await admin
    .from("stt_sessions")
    .select("id")
    .eq("status", "reserved")
    .lt("created_at", cutoff);

  const ids = (stale ?? []).map((s) => s.id);
  if (ids.length > 0) {
    await admin.from("stt_sessions").update({ status: "expired", updated_at: new Date().toISOString() }).in("id", ids);
  }
  return NextResponse.json({ ok: true, expired: ids.length });
}
