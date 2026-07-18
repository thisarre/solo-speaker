import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  // Audit 2026-07-18, reco Technique-2 : la confirmation est TRANSACTIONNELLE
  // côté Postgres (confirm_stt_session : SELECT … FOR UPDATE + upsert dans la
  // même transaction). Fini le TOCTOU du garde applicatif et le double
  // comptage sur confirmations concurrentes. La sémantique du compteur est
  // spécifiée (et testée) par applyConfirmation (stt-metering.ts).
  const admin = createAdminClient();
  // (idiome maison : Functions non générées dans database.types — même cast
  //  que consume_ai_rate_limit dans lib/rate-limit.ts)
  const { error } = await admin.rpc("confirm_stt_session" as never, {
    p_session_id: sessionId,
    p_user_id: user.id,
    p_confirmed_seconds: confirmedSeconds
  } as never);

  if (error) {
    // Avant l'audit, un échec d'écriture était silencieux (« drift silencieux »).
    console.error("[stt/session] confirmation échouée:", error.message);
    return NextResponse.json({ error: "Confirmation indisponible. Réessaie." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
