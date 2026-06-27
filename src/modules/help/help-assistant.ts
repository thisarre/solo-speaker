import { localizedPath, type Locale } from "@/i18n/routing";
import type { getMessages } from "@/i18n/messages";

type HelpAssistantCopy = ReturnType<typeof getMessages>["helpAssistant"];

export type HelpAction = {
  href: string;
  label: string;
};

export type HelpChatMessage = {
  content: string;
  role: "assistant" | "user";
};

export type HelpAssistantReply = {
  answer: string;
  followUp: string;
};

const actionKeywords = {
  createTalk: ["create", "new", "talk", "prise", "parole", "creer", "nouvelle", "brouillon"],
  forgotPassword: ["password", "forgot", "reset", "mot", "passe", "oublie", "reinitialiser"],
  pricing: ["pricing", "price", "subscription", "trial", "tarif", "prix", "abonnement", "essai"],
  prompter: ["prompter", "teleprompter", "speak", "repeat", "prompteur", "repeter", "presenter"],
  settings: ["settings", "theme", "language", "ai", "reglages", "langue", "assistant", "ia"],
  progression: ["progress", "readiness", "preparation", "progression", "pret"]
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function matchesAny(question: string, keywords: string[]) {
  const normalizedQuestion = normalize(question);
  return keywords.some((keyword) => normalizedQuestion.includes(normalize(keyword)));
}

export function getRelevantHelpActions(question: string, locale: Locale, copy: HelpAssistantCopy): HelpAction[] {
  const candidates: Array<{ href: string; keywords: string[]; label: string }> = [
    { href: "/talks/new?guided=1", keywords: actionKeywords.createTalk, label: copy.actions.createTalk },
    { href: "/forgot-password", keywords: actionKeywords.forgotPassword, label: copy.actions.forgotPassword },
    { href: "/pricing", keywords: actionKeywords.pricing, label: copy.actions.pricing },
    { href: "/talks", keywords: actionKeywords.prompter, label: copy.actions.talks },
    { href: "/settings", keywords: actionKeywords.settings, label: copy.actions.settings },
    { href: "/progression", keywords: actionKeywords.progression, label: copy.actions.progression }
  ];

  const matched = candidates.filter((candidate) => matchesAny(question, candidate.keywords));
  const fallback = matched.length ? matched : [candidates[0], candidates[4], candidates[5]];

  return fallback.slice(0, 3).map((action) => ({
    href: localizedPath(action.href, locale),
    label: action.label
  }));
}

export function buildHelpAssistantPrompt({
  copy,
  currentPath,
  history = [],
  locale,
  question
}: {
  copy: HelpAssistantCopy;
  currentPath: string;
  history?: HelpChatMessage[];
  locale: Locale;
  question: string;
}) {
  const languageInstruction = locale === "fr" ? "Reply in French" : "Reply in English";
  const appMap = copy.prompt.appMap.map((item) => `- ${item}`).join("\n");
  const historyText = history.slice(-6).map((message) => `${message.role}: ${message.content}`).join("\n");

  return [
    copy.prompt.identity,
    languageInstruction,
    copy.prompt.boundaries,
    copy.prompt.format,
    `Current page: ${currentPath || "/"}`,
    `App map:\n${appMap}`,
    historyText ? `Recent conversation:\n${historyText}` : "",
    `User question: ${question}`
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function parseHelpAssistantReply(text: string, fallbackAnswer: string): HelpAssistantReply {
  try {
    const parsed = JSON.parse(text) as Partial<HelpAssistantReply>;
    const answer = typeof parsed.answer === "string" ? parsed.answer.trim() : "";
    const followUp = typeof parsed.followUp === "string" ? parsed.followUp.trim() : "";
    return {
      answer: answer || fallbackAnswer,
      followUp
    };
  } catch {
    return {
      answer: fallbackAnswer,
      followUp: ""
    };
  }
}

export function buildFallbackHelpAnswer(question: string, locale: Locale, copy: HelpAssistantCopy) {
  const actions = getRelevantHelpActions(question, locale, copy);
  const actionLabel = actions[0]?.label ?? copy.actions.createTalk;
  return copy.fallbackAnswer.replace("{action}", actionLabel);
}
