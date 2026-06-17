import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/database.types";

export const runtime = "nodejs";

const maxAudioSizeBytes = 25 * 1024 * 1024;
const supportedAudioTypes = new Set([
  "audio/flac",
  "audio/mp3",
  "audio/mp4",
  "audio/mpeg",
  "audio/mpga",
  "audio/m4a",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "video/mp4",
  "video/webm"
]);

type TranscriptionAuth = {
  reason: string;
  supabase: SupabaseClient<Database>;
  user: User | null;
};

type OpenAITranscriptionBody = {
  text?: string;
  error?: {
    message?: string;
  };
};

function errorResponse(message: string, status = 400, headers?: HeadersInit) {
  return NextResponse.json({ ok: false, error: message }, { status, headers });
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

async function getAuthenticatedUser(request: NextRequest): Promise<TranscriptionAuth> {
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

function fileExtensionForType(type: string) {
  if (type.includes("webm")) return "webm";
  if (type.includes("ogg")) return "ogg";
  if (type.includes("wav")) return "wav";
  if (type.includes("mp4")) return "mp4";
  if (type.includes("mpeg") || type.includes("mp3")) return "mp3";
  if (type.includes("flac")) return "flac";
  if (type.includes("m4a")) return "m4a";
  return "webm";
}

function baseMimeType(type: string) {
  return type.split(";")[0]?.trim().toLowerCase() ?? "";
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return errorResponse("OPENAI_API_KEY manque dans l'environnement serveur.", 500);
  }

  const auth = await getAuthenticatedUser(request);

  if (!auth.user) {
    return errorResponse(`Session requise pour transcrire un mémo vocal. Diagnostic: ${auth.reason}.`, 401, {
      "x-assistant-auth": auth.reason
    });
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Audio invalide.");
  }

  const audio = formData.get("audio");
  const languageValue = formData.get("language");
  const language = languageValue === "EN" ? "en" : "fr";

  if (!(audio instanceof File)) {
    return errorResponse("Ajoute un fichier audio à transcrire.");
  }

  if (audio.size <= 0) {
    return errorResponse("Le mémo audio est vide.");
  }

  if (audio.size > maxAudioSizeBytes) {
    return errorResponse("Le mémo audio dépasse 25 MB.");
  }

  const audioMimeType = baseMimeType(audio.type);

  if (audioMimeType && !supportedAudioTypes.has(audioMimeType)) {
    return errorResponse("Format audio non supporté. Utilise webm, mp3, mp4, m4a, wav, ogg ou flac.");
  }

  const extension = fileExtensionForType(audioMimeType);
  const audioFile = new File([audio], `voice-memo.${extension}`, {
    type: audioMimeType || "audio/webm"
  });
  const openAiFormData = new FormData();
  openAiFormData.append("file", audioFile);
  openAiFormData.append("model", process.env.OPENAI_TRANSCRIPTION_MODEL || "gpt-4o-mini-transcribe");
  openAiFormData.append("language", language);
  openAiFormData.append("response_format", "json");
  openAiFormData.append("prompt", "Mémo vocal pour préparer une prise de parole. Conserve les idées, la ponctuation et les formulations naturelles.");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: openAiFormData
  });

  let payload: OpenAITranscriptionBody;

  try {
    payload = (await response.json()) as OpenAITranscriptionBody;
  } catch {
    return errorResponse("Réponse OpenAI illisible.", 502);
  }

  if (!response.ok) {
    const message =
      response.status === 401
        ? "Clé OpenAI absente ou invalide côté serveur."
        : response.status === 429
          ? "Limite OpenAI atteinte. Réessaie dans un instant."
          : payload.error?.message || "Transcription impossible.";

    return errorResponse(message, response.status);
  }

  const text = payload.text?.trim();

  if (!text) {
    return errorResponse("Aucun texte détecté dans ce mémo.", 502);
  }

  return NextResponse.json({ ok: true, text });
}
