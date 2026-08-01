"use client";

import posthog from "posthog-js";
import { createClient } from "@/lib/supabase/browser";
import { getMessages } from "@/i18n/messages";
import type { TalkLanguage } from "@/types/talk";

const errors = getMessages("fr").errors;

type TranscribeVoiceMemoResponse =
  | {
      ok: true;
      text: string;
    }
  | {
      ok: false;
      error: string;
    };

export async function transcribeVoiceMemo(input: { audio: Blob; language: TalkLanguage }) {
  const supabase = createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error(errors.voiceSessionMissing);
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

  const payload = (await response.json().catch(() => ({ ok: false, error: errors.invalidTranscriptionResponse }))) as TranscribeVoiceMemoResponse;

  if (!response.ok || !payload.ok) {
    throw new Error(payload.ok ? errors.transcriptionFailed : payload.error);
  }

  posthog.capture("voice_memo_transcribed", { language: input.language, audio_size_bytes: input.audio.size });

  return payload.text;
}
