"use client";

import { createClient } from "@/lib/supabase/browser";

type TranscribeVoiceMemoResponse =
  | {
      ok: true;
      text: string;
    }
  | {
      ok: false;
      error: string;
    };

export async function transcribeVoiceMemo(input: { audio: Blob; language: "FR" | "EN" }) {
  const supabase = createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Session navigateur Supabase introuvable. Déconnecte-toi puis reconnecte-toi.");
  }

  const formData = new FormData();
  formData.append("audio", input.audio, `voice-memo.${input.audio.type.includes("webm") ? "webm" : "mp4"}`);
  formData.append("language", input.language);

  const response = await fetch("/api/ai/transcribe", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Authorization: `Bearer ${session.access_token}`
    },
    body: formData
  });

  const payload = (await response.json().catch(() => ({ ok: false, error: "Réponse transcription invalide." }))) as TranscribeVoiceMemoResponse;

  if (!response.ok || !payload.ok) {
    throw new Error(payload.ok ? "Transcription impossible." : payload.error);
  }

  return payload.text;
}
