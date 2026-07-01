import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { can } from "@/modules/billing/capabilities";
import { consumeAssistantAiCredit } from "@/modules/billing/ai-credits";
import type { BillingPlan } from "@/modules/billing/entitlements";
import type { TalkWithSectionsRow } from "@/modules/talks/mappers";
import type { TalkLanguage } from "@/types/talk";
import type { Database } from "@/lib/supabase/database.types";
import type { User } from "@supabase/supabase-js";

const SUPPORTED_LANGUAGES = new Set<string>(["FR", "EN", "ES", "DE", "IT", "PT"]);
const openAiUrl = "https://api.openai.com/v1/responses";

const languageNames: Record<string, string> = {
  FR: "French",
  EN: "English",
  ES: "Spanish",
  DE: "German",
  IT: "Italian",
  PT: "Portuguese"
};

type TranslateSection = { heading: string; body: string };

function buildTranslatePrompt(title: string, sections: TranslateSection[], sourceLang: string, targetLang: string) {
  const source = languageNames[sourceLang] ?? sourceLang;
  const target = languageNames[targetLang] ?? targetLang;
  const sectionsText = sections.map((s, i) => `Section ${i + 1}\nHeading: ${s.heading}\nBody:\n${s.body}`).join("\n\n---\n\n");

  return `Translate the following talk from ${source} to ${target}.

Title: ${title}

${sectionsText}

Rules:
- Translate all text faithfully, including headings and bodies.
- Preserve tone, structure and oral style.
- Keep the same number of sections in the same order.
- Do not add commentary, notes, or extra content.`;
}

function createRouteSupabaseClient(request: NextRequest) {
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {}
    }
  });
}

function createBearerSupabaseClient(token: string) {
  const { url, anonKey } = getSupabaseEnv();

  return createSupabaseClient<Database>(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
}

async function getUser(request: NextRequest): Promise<{ user: User | null; supabase: ReturnType<typeof createRouteSupabaseClient> }> {
  const cookieSupabase = createRouteSupabaseClient(request);
  const { data: { user: cookieUser }, error: cookieError } = await cookieSupabase.auth.getUser();

  if (cookieUser && !cookieError) return { user: cookieUser, supabase: cookieSupabase };

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";
  if (!token) return { user: null, supabase: cookieSupabase };

  const bearerSupabase = createBearerSupabaseClient(token);
  const { data: { user }, error } = await bearerSupabase.auth.getUser(token);

  if (error || !user) return { user: null, supabase: cookieSupabase };
  return { user, supabase: bearerSupabase };
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

type RouteParams = { params: Promise<{ talkId: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return errorResponse("OPENAI_API_KEY manque dans l'environnement serveur.", 500);

  const { talkId } = await params;
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(talkId)) return errorResponse("Talk introuvable.", 404);

  const { user, supabase } = await getUser(request);
  if (!user) return errorResponse("Session requise.", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Requête JSON invalide.");
  }

  const record = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  const targetLanguage = typeof record?.targetLanguage === "string" ? record.targetLanguage.trim().toUpperCase() : "";

  if (!SUPPORTED_LANGUAGES.has(targetLanguage)) {
    return errorResponse("Langue cible invalide.");
  }

  const { data: profile } = await supabase.from("profiles").select("billing_plan").eq("id", user.id).maybeSingle();
  const plan = (profile?.billing_plan ?? "trial") as BillingPlan;

  if (!can(plan, "talk.multilingual")) {
    return errorResponse("Cette fonctionnalité nécessite le plan Pro.", 403);
  }

  const credit = await consumeAssistantAiCredit(supabase, user.id);
  if (!credit.allowed) {
    return errorResponse("Limite IA de l'essai atteinte. Passez à Studio pour un assistant illimité.", 402);
  }

  const { data: rawTalk, error: talkError } = await supabase
    .from("talks")
    .select("*, talk_sections(*)")
    .eq("id", talkId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (talkError) return errorResponse(talkError.message, 500);
  if (!rawTalk) return errorResponse("Talk introuvable.", 404);

  const sourceTalk = rawTalk as unknown as TalkWithSectionsRow;

  if (sourceTalk.language === targetLanguage) {
    return errorResponse("La langue cible doit être différente de la langue source.");
  }

  const sections = [...(sourceTalk.talk_sections ?? [])].sort((a, b) => a.position - b.position);

  const prompt = buildTranslatePrompt(
    sourceTalk.title,
    sections.map((s) => ({ heading: s.heading, body: s.body })),
    sourceTalk.language,
    targetLanguage
  );

  const model = process.env.OPENAI_MODEL || "gpt-5-mini";
  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      sections: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            heading: { type: "string" },
            body: { type: "string" }
          },
          required: ["heading", "body"]
        }
      }
    },
    required: ["title", "sections"]
  };

  const aiResponse = await fetch(openAiUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: "Tu es un traducteur expert pour discours oraux. Tu retournes uniquement du JSON conforme au schema." },
        { role: "user", content: prompt }
      ],
      text: {
        format: { type: "json_schema", name: "talk_translation", strict: true, schema }
      },
      store: false
    })
  });

  type OpenAIBody = { output?: { type?: string; content?: { type: string; text: string }[] }[]; output_text?: string; error?: { message?: string } };
  let aiPayload: OpenAIBody;

  try {
    aiPayload = (await aiResponse.json()) as OpenAIBody;
  } catch {
    return errorResponse("Réponse OpenAI illisible.", 502);
  }

  if (!aiResponse.ok) {
    return errorResponse(aiPayload.error?.message ?? "OpenAI a refusé la génération.", aiResponse.status);
  }

  const outputText =
    typeof aiPayload.output_text === "string"
      ? aiPayload.output_text
      : (aiPayload.output
          ?.flatMap((item) => item.content ?? [])
          .filter((c) => c.type === "output_text")
          .map((c) => c.text)
          .join("") ?? "");

  if (!outputText) return errorResponse("OpenAI n'a retourné aucun contenu.", 502);

  let parsed: { title: string; sections: { heading: string; body: string }[] };
  try {
    parsed = JSON.parse(outputText) as typeof parsed;
  } catch {
    return errorResponse("La réponse IA n'est pas du JSON valide.", 502);
  }

  if (!parsed.title || !Array.isArray(parsed.sections)) {
    return errorResponse("La réponse IA est incomplète.", 502);
  }

  const translatedTitle = `${parsed.title.trim()} (${targetLanguage})`;

  const { data: newTalk, error: insertError } = await supabase
    .from("talks")
    .insert({
      user_id: user.id,
      title: translatedTitle,
      type: sourceTalk.type,
      status: "draft",
      audience: sourceTalk.audience,
      duration_minutes: sourceTalk.duration_minutes,
      language: targetLanguage as TalkLanguage,
      source_talk_id: talkId
    })
    .select("id")
    .single();

  if (insertError || !newTalk) return errorResponse(insertError?.message ?? "Impossible de créer le talk traduit.", 500);

  const sectionsToInsert = parsed.sections.map((s, position) => ({
    talk_id: newTalk.id,
    heading: s.heading?.trim() || "—",
    body: typeof s.body === "string" ? s.body : "",
    position
  }));

  const { error: sectionsError } = await supabase.from("talk_sections").insert(sectionsToInsert);
  if (sectionsError) return errorResponse(sectionsError.message, 500);

  return NextResponse.json({ ok: true, talkId: newTalk.id });
}
