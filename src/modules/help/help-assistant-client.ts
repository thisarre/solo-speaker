"use client";

import type { Locale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/browser";
import type { HelpAction, HelpChatMessage } from "./help-assistant";

export type HelpChatResult = {
  actions: HelpAction[];
  answer: string;
  followUp: string;
  ok: true;
};

type HelpChatError = {
  error: string;
  ok: false;
};

export async function askHelpAssistant(input: {
  currentPath: string;
  history: HelpChatMessage[];
  locale: Locale;
  question: string;
}) {
  const supabase = createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const response = await fetch("/api/help/chat", {
    body: JSON.stringify(input),
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
    },
    method: "POST"
  });
  const payload = (await response.json()) as HelpChatResult | HelpChatError;

  if (!response.ok || !payload.ok) {
    throw new Error(payload.ok ? "Help assistant unavailable." : payload.error);
  }

  return payload;
}
