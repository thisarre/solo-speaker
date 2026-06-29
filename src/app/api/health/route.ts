import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lightweight public health endpoint: confirms the app is serving and the
// database is reachable. Returns booleans only (no data), used by the daily
// synthetic-monitoring cron and by any external uptime checker.
export async function GET() {
  let db = false;
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("profiles").select("id", { count: "exact", head: true }).limit(1);
    db = !error;
  } catch {
    db = false;
  }

  return NextResponse.json(
    { status: db ? "ok" : "degraded", db, timestamp: new Date().toISOString() },
    { status: db ? 200 : 503, headers: { "cache-control": "no-store" } }
  );
}
