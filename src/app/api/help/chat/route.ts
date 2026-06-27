import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { getMessages } from "@/i18n/messages";
import { defaultLocale, isLocale, type Locale } from "@/i18n/routing";
import { consumeAiRateLimit, getRequestIp } from "@/lib/rate-limit";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { buildFallbackHelpAnswer, buildHelpAssistantPrompt, getRelevantHelpActions, parseHelpAssistantReply, type HelpChatMessage } from "@/modules/help/help-assistant";
import type { Database } from "@/lib/supabase/database.types";

export const runtime = "nodejs";

const openAiUrl = "https://api.openai.com/v1/responses";

type HelpAuth = {
  reason: string;
  supabase: SupabaseClient<Database>;
  user: User | null;
};

type OpenAITextContent = {
  type: "output_text";
  text: string;
};

type OpenAIResponseOutput = {
  content?: OpenAITextContent[];
  type?: string;
};

type OpenAIResponseBody = {
  error?: {
    message?: string;
  };
  output?: OpenAIResponseOutput[];
  output_text?: string;
};

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

async function getAuthenticatedUser(request: NextRequest): Promise<HelpAuth> {
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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function cleanString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function cleanHistory(value: unknown): HelpChatMessage[] {
  return Array.isArray(value)
    ? value
        .map((item): HelpChatMessage | null => {
          const record = asRecord(item);
          const role = record?.role === "assistant" ? "assistant" : record?.role === "user" ? "user" : null;
          const content = cleanString(record?.content).slice(0, 1200);
          return role && content ? { role, content } : null;
        })
        .filter((item): item is HelpChatMessage => Boolean(item))
        .slice(-8)
    : [];
}

function extractOutputText(payload: OpenAIResponseBody) {
  if (typeof payload.output_text === "string") return payload.output_text;
  return (
    payload.output
      ?.flatMap((item) => item.content ?? [])
      .filter((item) => item.type === "output_text")
      .map((item) => item.text)
      .join("") ?? ""
  );
}

function jsonResponse(payload: unknown, status = 200, headers?: HeadersInit) {
  return NextResponse.json(payload, { status, headers });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);

  if (!auth.user) {
    return jsonResponse({ ok: false, error: "Session required." }, 401, { "x-assistant-auth": auth.reason });
  }

  let rateLimit;

  try {
    rateLimit = await consumeAiRateLimit({
      identity: {
        ip: getRequestIp(request.headers),
        userId: auth.user.id
      },
      route: "help_chat"
    });
  } catch {
    return jsonResponse({ ok: false, error: "Rate limit protection unavailable." }, 503);
  }

  if (!rateLimit.allowed) {
    return jsonResponse({ ok: false, error: "Too many help requests. Try again shortly." }, 429, rateLimit.headers);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON." }, 400);
  }

  const record = asRecord(body);
  const question = cleanString(record?.question).slice(0, 1200);
  const currentPath = cleanString(record?.currentPath, "/").slice(0, 300);
  const localeValue = cleanString(record?.locale);
  const locale: Locale = isLocale(localeValue) ? localeValue : defaultLocale;
  const copy = getMessages(locale).helpAssistant;
  const actions = getRelevantHelpActions(question, locale, copy);
  const fallbackAnswer = buildFallbackHelpAnswer(question, locale, copy);

  if (!question) {
    return jsonResponse({ ok: false, error: "Question required." }, 400);
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return jsonResponse({ ok: true, actions, answer: fallbackAnswer, followUp: "" }, 200, rateLimit.headers);
  }

  const prompt = buildHelpAssistantPrompt({
    copy,
    currentPath,
    history: cleanHistory(record?.history),
    locale,
    question
  });
  const model = process.env.OPENAI_HELP_MODEL || process.env.OPENAI_MODEL || "gpt-5-mini";
  const response = await fetch(openAiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      input: [
        {
          role: "system",
          content: prompt
        }
      ],
      model,
      store: false,
      text: {
        format: {
          name: "solo_speaker_help_reply",
          schema: {
            additionalProperties: false,
            properties: {
              answer: { type: "string" },
              followUp: { type: "string" }
            },
            required: ["answer", "followUp"],
            type: "object"
          },
          strict: true,
          type: "json_schema"
        }
      }
    })
  });

  let payload: OpenAIResponseBody;

  try {
    payload = (await response.json()) as OpenAIResponseBody;
  } catch {
    return jsonResponse({ ok: true, actions, answer: fallbackAnswer, followUp: "" }, 200, rateLimit.headers);
  }

  if (!response.ok) {
    return jsonResponse({ ok: true, actions, answer: fallbackAnswer, followUp: "" }, 200, rateLimit.headers);
  }

  const reply = parseHelpAssistantReply(extractOutputText(payload), fallbackAnswer);
  return jsonResponse({ ok: true, actions, ...reply }, 200, rateLimit.headers);
}
