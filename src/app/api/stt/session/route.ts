import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyConfirmation } from "@/modules/billing/stt-metering";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Session required." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { sessionId?: string; confirmedSeconds?: number };
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  const confirmedSeconds = Math.max(0, Math.floor(Number(body.confirmedSeconds) || 0));
  if (!sessionId) return NextResponse.json({ error: "sessionId required." }, { status: 400 });

  const admin = createAdminClient();
  const { data: session } = await admin
    .from("stt_sessions")
    .select("user_id, period_key, reserved_seconds, status")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || session.user_id !== user.id) return NextResponse.json({ ok: true });
  if (session.status === "confirmed") return NextResponse.json({ ok: true });

  const { data: counter } = await admin
    .from("usage_counters")
    .select("cloud_reserved_seconds, cloud_confirmed_seconds")
    .eq("user_id", session.user_id)
    .eq("period_key", session.period_key)
    .maybeSingle();

  const next = applyConfirmation(
    { cloudReserved: counter?.cloud_reserved_seconds ?? 0, cloudConfirmed: counter?.cloud_confirmed_seconds ?? 0 },
    { reservedSeconds: session.reserved_seconds, confirmedSeconds }
  );

  await admin
    .from("stt_sessions")
    .update({ confirmed_seconds: confirmedSeconds, status: "confirmed", updated_at: new Date().toISOString() })
    .eq("id", sessionId);
  await admin.from("usage_counters").upsert(
    {
      user_id: session.user_id,
      period_key: session.period_key,
      cloud_reserved_seconds: next.cloudReserved,
      cloud_confirmed_seconds: next.cloudConfirmed,
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id,period_key" }
  );

  return NextResponse.json({ ok: true });
}
