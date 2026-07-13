import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { wordCount } from "@/lib/utils";

export const runtime = "nodejs";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const openAiUrl = "https://api.openai.com/v1/responses";

function formatMinSec(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function buildPrompt(params: {
  title: string;
  type: string;
  durationSeconds: number;
  estimatedSeconds: number | null;
  wpm: number | null;
  coveragePct: number | null;
  locale: string;
}) {
  const lang = params.locale === "fr" ? "Français" : "English";
  const coverageStr = params.coveragePct !== null ? `${params.coveragePct}%` : "unknown";
  const wpmStr = params.wpm !== null ? `${params.wpm} wpm (reference: ~140 wpm)` : "unknown";
  const durationStr = formatMinSec(params.durationSeconds);
  const targetStr = params.estimatedSeconds ? formatMinSec(params.estimatedSeconds) : "unknown";

  if (params.locale === "fr") {
    return [
      `Tu es un coach de prise de parole. En 2 à 3 phrases maximum, identifie le principal axe d'amélioration pour cet orateur.`,
      `Prise de parole : "${params.title}" (${params.type})`,
      `Durée réelle : ${durationStr} | Durée cible : ${targetStr}`,
      `Rythme moyen : ${wpmStr}`,
      `Script couvert : ${coverageStr}`,
      `Réponds en ${lang}. Sois direct, bienveillant et actionnable. Ne dépasse pas 3 phrases. Aucune liste.`
    ].join("\n");
  }

  return [
    `You are a public speaking coach. In 2-3 sentences maximum, identify the main area for improvement for this speaker.`,
    `Talk: "${params.title}" (${params.type})`,
    `Actual duration: ${durationStr} | Target: ${targetStr}`,
    `Average pace: ${wpmStr}`,
    `Script covered: ${coverageStr}`,
    `Respond in ${lang}. Be direct, supportive and actionable. Maximum 3 sentences. No bullet points.`
  ].join("\n");
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ ok: false, error: "AI unavailable." }, { status: 503 });

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Session required." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { sessionId?: string; locale?: string };
  const sessionId = typeof body.sessionId === "string" && uuidPattern.test(body.sessionId) ? body.sessionId : null;
  const locale = body.locale === "fr" ? "fr" : "en";

  if (!sessionId) return NextResponse.json({ ok: false, error: "Invalid session." }, { status: 400 });

  const { data: session } = await supabase
    .from("rehearsal_sessions")
    .select("id, talk_id, talk_title, duration_seconds, estimated_seconds, ai_summary")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!session) return NextResponse.json({ ok: false, error: "Session not found." }, { status: 404 });

  if (session.ai_summary) return NextResponse.json({ ok: true, summary: session.ai_summary });

  let totalWords = 0;
  if (session.talk_id) {
    const { data: sections } = await supabase
      .from("talk_sections")
      .select("heading, body")
      .eq("talk_id", session.talk_id);
    totalWords = (sections ?? []).reduce((sum, s) => sum + wordCount(s.heading) + wordCount(s.body), 0);
  }

  const wpm = totalWords > 0 && session.duration_seconds > 0
    ? Math.round((totalWords / session.duration_seconds) * 60)
    : null;
  const coveragePct = session.estimated_seconds && session.estimated_seconds > 0
    ? Math.min(100, Math.round((session.duration_seconds / session.estimated_seconds) * 100))
    : null;

  const prompt = buildPrompt({
    title: session.talk_title ?? "—",
    type: "talk",
    durationSeconds: session.duration_seconds,
    estimatedSeconds: session.estimated_seconds,
    wpm,
    coveragePct,
    locale
  });

  const model = process.env.OPENAI_MODEL || "gpt-5-mini";

  let summary = "";
  try {
    const aiRes = await fetch(openAiUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        input: [
          { role: "system", content: "You are a concise public speaking coach." },
          { role: "user", content: prompt }
        ],
        text: { format: { type: "text" } },
        store: false
      })
    });

    type AiBody = { output_text?: string; output?: { content?: { type: string; text: string }[] }[] };
    const aiData = (await aiRes.json()) as AiBody;
    summary =
      aiData.output_text?.trim() ||
      (aiData.output?.flatMap((o) => o.content ?? []).find((c) => c.type === "output_text")?.text ?? "").trim();
  } catch {
    return NextResponse.json({ ok: false, error: "AI generation failed." }, { status: 502 });
  }

  if (!summary) return NextResponse.json({ ok: false, error: "Empty AI response." }, { status: 502 });

  const admin = createAdminClient();
  await admin.from("rehearsal_sessions").update({ ai_summary: summary }).eq("id", sessionId);

  return NextResponse.json({ ok: true, summary });
}
