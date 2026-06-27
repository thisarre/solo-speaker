import assert from "node:assert/strict";
import test from "node:test";
import enMessages from "./messages/en.json" with { type: "json" };
import frMessages from "./messages/fr.json" with { type: "json" };
import { landingFaq } from "@/modules/landing/seo";

type MessageEntry = {
  path: string;
  value: string;
};

function flattenMessages(value: unknown, path = ""): MessageEntry[] {
  if (typeof value === "string") {
    if (/^pricing\.plans\[\d+\]\.id$/.test(path)) return [];
    if (/^onboarding\.(roles|talkTypes)\[\d+\]\[0\]$/.test(path)) return [];
    return value.startsWith("/") ? [] : [{ path, value }];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => flattenMessages(item, `${path}[${index}]`));
  }

  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => flattenMessages(item, path ? `${path}.${key}` : key));
  }

  return [];
}

const allowedEnglishInFrench = [
  "AI",
  "EUR",
  "FAQ",
  "Google",
  "Google Docs",
  "IA",
  "Notion",
  "PDF",
  "Solo Speaker",
  "Solo Speaker Studio",
  "Stripe Checkout",
  "Studio",
  "Supabase"
];

const englishUiWordsInFrench = [
  "Back",
  "Create",
  "Dashboard",
  "Draft",
  "Founder",
  "Founders",
  "Live",
  "Pricing",
  "Pitch",
  "Ready",
  "Settings",
  "Speaking Mode",
  "Support",
  "Team",
  "Training",
  "Trial",
  "Voice Follow",
  "auto-scroll",
  "founder",
  "founders",
  "keynote",
  "keynotes",
  "live",
  "pitch",
  "pitchs",
  "speech",
  "talk",
  "talks",
  "timing",
  "timer"
];

const frenchUiWordsInEnglish = [
  "Accueil",
  "Annuler",
  "Archivé",
  "Brouillon",
  "Connexion",
  "Créer",
  "Enregistrer",
  "Réglages",
  "Retour",
  "Tarifs",
  "gratuit",
  "prise de parole"
];

function removeAllowedTerms(value: string) {
  const withoutPlaceholders = value.replaceAll(/\{[^}]+\}/g, "");
  return allowedEnglishInFrench.reduce((text, term) => text.replaceAll(term, ""), withoutPlaceholders);
}

function entriesContaining(entries: MessageEntry[], terms: string[], sanitize = (value: string) => value) {
  const pattern = new RegExp(`(^|[^\\p{L}])(${terms.map(escapeRegExp).join("|")})(?=$|[^\\p{L}])`, "iu");
  return entries
    .map((entry) => ({ ...entry, searchableValue: sanitize(entry.value) }))
    .filter((entry) => pattern.test(entry.searchableValue))
    .map(({ path, value }) => `${path}: ${value}`);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("French messages do not expose English UI wording", () => {
  const mixedEntries = entriesContaining(flattenMessages(frMessages), englishUiWordsInFrench, removeAllowedTerms);
  assert.deepEqual(mixedEntries, []);
});

test("English messages do not expose French UI wording", () => {
  const mixedEntries = entriesContaining(flattenMessages(enMessages), frenchUiWordsInEnglish);
  assert.deepEqual(mixedEntries, []);
});

test("French marketing FAQ does not expose English UI wording", () => {
  const mixedEntries = entriesContaining(flattenMessages(landingFaq.fr), englishUiWordsInFrench, removeAllowedTerms);
  assert.deepEqual(mixedEntries, []);
});
