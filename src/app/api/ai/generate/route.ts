import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { buildTalkOutlinePrompt } from "@/modules/assistant/prompts/build-talk-outline-prompt";
import { buildSectionExpandPrompt } from "@/modules/assistant/prompts/build-section-expand-prompt";
import { buildOralizeSectionPrompt } from "@/modules/assistant/prompts/build-oralize-section-prompt";
import { buildShortenSectionPrompt } from "@/modules/assistant/prompts/build-shorten-section-prompt";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type {
  AssistantAction,
  AssistantGenerateRequest,
  AssistantGenerateResponse,
  AssistantOutlineSection,
  AssistantSectionContext,
  AssistantTalkContext
} from "@/modules/assistant/types";
import type { TalkType } from "@/types/talk";
import type { Database } from "@/lib/supabase/database.types";

const actions = new Set<AssistantAction>(["outline", "expand-section", "oralize-section", "shorten-section"]);
const talkTypes = new Set<TalkType>(["sermon", "conference", "training", "pitch", "speech"]);
const languages = new Set(["FR", "EN"]);
const openAiUrl = "https://api.openai.com/v1/responses";

type OpenAITextContent = {
  type: "output_text";
  text: string;
};

type OpenAIResponseOutput = {
  type?: string;
  content?: OpenAITextContent[];
};

type OpenAIResponseBody = {
  output?: OpenAIResponseOutput[];
  output_text?: string;
  error?: {
    message?: string;
  };
};

type AssistantAuth = {
  reason: string;
  supabase: SupabaseClient<Database>;
  user: User | null;
};

function errorResponse(message: string, status = 400, headers?: HeadersInit) {
  return NextResponse.json<AssistantGenerateResponse>({ ok: false, error: message }, { status, headers });
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function cleanString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function cleanUuid(value: unknown) {
  const text = cleanString(value);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text) ? text : "";
}

function parseTalk(value: unknown): AssistantTalkContext | null {
  const record = asRecord(value);
  if (!record) return null;

  const type = cleanString(record.type) as TalkType;
  const language = cleanString(record.language) as "FR" | "EN";
  const targetDurationMin = Math.max(1, Math.min(180, Math.round(Number(record.targetDurationMin ?? record.durationMinutes) || 10)));

  if (!talkTypes.has(type) || !languages.has(language)) {
    return null;
  }

  return {
    title: cleanString(record.title),
    type,
    audience: cleanString(record.audience),
    objective: cleanString(record.objective),
    targetDurationMin,
    language
  };
}

function parseSection(value: unknown): AssistantSectionContext | null {
  const record = asRecord(value);
  if (!record) return null;

  return {
    heading: cleanString(record.heading),
    body: cleanString(record.body)
  };
}

function buildPrompt(input: AssistantGenerateRequest) {
  if (input.action === "outline") {
    return buildTalkOutlinePrompt(input.talk);
  }

  if (!input.section) {
    throw new Error("Section requise pour cette action IA.");
  }

  if (input.action === "expand-section") {
    return buildSectionExpandPrompt(input.talk, input.section);
  }

  if (input.action === "oralize-section") {
    return buildOralizeSectionPrompt(input.talk, input.section);
  }

  return buildShortenSectionPrompt(input.talk, input.section);
}

function schemaFor(action: AssistantAction) {
  if (action === "outline") {
    return {
      type: "object",
      additionalProperties: false,
      properties: {
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
      required: ["sections"]
    };
  }

  return {
    type: "object",
    additionalProperties: false,
    properties: {
      heading: { type: "string" },
      body: { type: "string" }
    },
    required: ["heading", "body"]
  };
}

function extractOutputText(payload: OpenAIResponseBody) {
  if (typeof payload.output_text === "string") {
    return payload.output_text;
  }

  return (
    payload.output
      ?.flatMap((item) => item.content ?? [])
      .filter((item) => item.type === "output_text")
      .map((item) => item.text)
      .join("") ?? ""
  );
}

function parseModelResult(action: AssistantAction, text: string): AssistantGenerateResponse {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "La réponse IA n'est pas un JSON valide." };
  }

  const record = asRecord(parsed);
  if (!record) {
    return { ok: false, error: "La réponse IA est vide." };
  }

  if (action === "outline") {
    const sectionsValue = record.sections;
    if (!Array.isArray(sectionsValue)) {
      return { ok: false, error: "Le plan généré est invalide." };
    }

    const sections = sectionsValue
      .map((section): AssistantOutlineSection | null => {
        const sectionRecord = asRecord(section);
        if (!sectionRecord) return null;
        const heading = cleanString(sectionRecord.heading);
        const body = cleanString(sectionRecord.body);
        return heading || body ? { heading: heading || "Sans titre", body } : null;
      })
      .filter((section): section is AssistantOutlineSection => Boolean(section));

    if (!sections.length) {
      return { ok: false, error: "Le plan généré ne contient aucune section exploitable." };
    }

    return { ok: true, result: { kind: "outline", sections } };
  }

  const heading = cleanString(record.heading);
  const body = cleanString(record.body);

  if (!body) {
    return { ok: false, error: "La section générée est vide." };
  }

  return { ok: true, result: { kind: "section", heading, body } };
}

function createRouteSupabaseClient(request: NextRequest) {
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        // This API route only verifies auth; middleware handles session refresh.
      }
    }
  });
}

function createBearerSupabaseClient(token: string) {
  const { url, anonKey } = getSupabaseEnv();

  return createSupabaseClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
}

async function getAuthenticatedUser(request: NextRequest): Promise<AssistantAuth> {
  const cookieSupabase = createRouteSupabaseClient(request);
  const {
    data: { user: cookieUser },
    error: cookieError
  } = await cookieSupabase.auth.getUser();

  if (cookieUser && !cookieError) return { user: cookieUser, reason: "cookie", supabase: cookieSupabase };

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";
  if (!token) return { user: null, reason: "missing_bearer", supabase: cookieSupabase };

  const bearerSupabase = createBearerSupabaseClient(token);

  const {
    data: { user },
    error
  } = await bearerSupabase.auth.getUser(token);

  if (error) return { user: null, reason: "invalid_bearer", supabase: cookieSupabase };
  return { user, reason: user ? "bearer" : "empty_bearer_user", supabase: user ? bearerSupabase : cookieSupabase };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return errorResponse("OPENAI_API_KEY manque dans l'environnement serveur.", 500);
  }

  const auth = await getAuthenticatedUser(request);

  if (!auth.user) {
    return errorResponse(`Session requise pour utiliser l'assistant IA. Diagnostic: ${auth.reason}.`, 401, {
      "x-assistant-auth": auth.reason
    });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("Requête JSON invalide.");
  }

  const record = asRecord(body);
  const action = cleanString(record?.action) as AssistantAction;
  const talkId = cleanUuid(record?.talkId);
  const talk = parseTalk(record?.talk);
  const section = parseSection(record?.section);

  if (!actions.has(action) || !talk || !talkId) {
    return errorResponse("Paramètres IA invalides.");
  }

  if (action !== "outline" && !section) {
    return errorResponse("Section requise pour cette action IA.");
  }

  const { data: ownedTalk, error: talkError } = await auth.supabase
    .from("talks")
    .select("id")
    .eq("id", talkId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (talkError) {
    return errorResponse(talkError.message, 500);
  }

  if (!ownedTalk) {
    return errorResponse("Talk introuvable pour cette session.", 404);
  }

  const input: AssistantGenerateRequest = { action, talkId, talk, section: section ?? undefined };
  const prompt = buildPrompt(input);
  const model = process.env.OPENAI_MODEL || "gpt-5-mini";

  const response = await fetch(openAiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: "Tu es un assistant d'ecriture orale. Tu retournes uniquement du JSON conforme au schema."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: action === "outline" ? "talk_outline" : "section_rewrite",
          strict: true,
          schema: schemaFor(action)
        }
      },
      store: false
    })
  });

  let payload: OpenAIResponseBody;

  try {
    payload = (await response.json()) as OpenAIResponseBody;
  } catch {
    return errorResponse("Réponse OpenAI illisible.", 502);
  }

  if (!response.ok) {
    const openAiMessage = payload.error?.message || "OpenAI a refusé la génération.";
    const publicMessage =
      response.status === 401
        ? "Clé OpenAI absente ou invalide côté serveur."
        : response.status === 429
          ? "Limite OpenAI atteinte. Réessaie dans un instant."
          : openAiMessage;

    return errorResponse(publicMessage, response.status);
  }

  const text = extractOutputText(payload);
  if (!text) {
    return errorResponse("OpenAI n'a retourné aucun contenu.", 502);
  }

  const result = parseModelResult(action, text);
  return NextResponse.json<AssistantGenerateResponse>(result, { status: result.ok ? 200 : 502 });
}
