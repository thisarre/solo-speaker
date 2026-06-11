"use client";

import type { AssistantGenerateRequest, AssistantGenerateResponse, AssistantGenerateResult } from "@/modules/assistant/types";
import { createClient } from "@/lib/supabase/browser";

export async function generateAssistantContent(input: AssistantGenerateRequest): Promise<AssistantGenerateResult> {
  const supabase = createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Session navigateur Supabase introuvable. Déconnecte-toi puis reconnecte-toi sur http://localhost:3000.");
  }

  const response = await fetch("/api/ai/generate", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
    },
    body: JSON.stringify(input)
  });

  let payload: AssistantGenerateResponse;

  try {
    payload = (await response.json()) as AssistantGenerateResponse;
  } catch {
    throw new Error("Réponse IA invalide.");
  }

  if (!response.ok || !payload.ok) {
    const authReason = response.status === 401 ? response.headers.get("x-assistant-auth") : null;
    const suffix = authReason ? ` (${authReason})` : "";
    throw new Error(`${payload.ok ? "Génération IA impossible." : payload.error}${suffix}`);
  }

  return payload.result;
}
