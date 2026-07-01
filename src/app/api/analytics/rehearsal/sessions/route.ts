import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MIN_DURATION_SECONDS = 30;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Session required." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    talkId?: string;
    durationSeconds?: number;
    estimatedSeconds?: number;
    startedAt?: string;
  };

  const durationSeconds = Math.floor(Number(body.durationSeconds) || 0);
  if (durationSeconds < MIN_DURATION_SECONDS) return NextResponse.json({ ok: true });

  const talkId = typeof body.talkId === "string" && uuidPattern.test(body.talkId) ? body.talkId : null;
  const estimatedSeconds =
    body.estimatedSeconds != null && Number(body.estimatedSeconds) > 0
      ? Math.floor(Number(body.estimatedSeconds))
      : null;
  let startedAt: string;
  if (typeof body.startedAt === "string") {
    const startedAtDate = new Date(body.startedAt);
    if (isNaN(startedAtDate.getTime())) {
      return NextResponse.json({ error: "Invalid startedAt." }, { status: 400 });
    }
    const now = Date.now();
    if (startedAtDate.getTime() > now) {
      return NextResponse.json({ error: "startedAt cannot be in the future." }, { status: 400 });
    }
    if (now - startedAtDate.getTime() > 24 * 60 * 60 * 1000) {
      return NextResponse.json({ error: "startedAt is too old." }, { status: 400 });
    }
    startedAt = startedAtDate.toISOString();
  } else {
    startedAt = new Date().toISOString();
  }

  let talkTitle: string | null = null;
  if (talkId) {
    const { data: talk } = await supabase
      .from("talks")
      .select("id, title")
      .eq("id", talkId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!talk) return NextResponse.json({ ok: true });
    talkTitle = talk.title ?? null;
  }

  const admin = createAdminClient();
  const { error: insertError } = await admin.from("rehearsal_sessions").insert({
    user_id: user.id,
    talk_id: talkId,
    talk_title: talkTitle,
    started_at: startedAt,
    duration_seconds: durationSeconds,
    estimated_seconds: estimatedSeconds
  });
  if (insertError) {
    console.error("[rehearsal/sessions] insert failed:", insertError.message);
    return NextResponse.json({ error: "Failed to record session." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
