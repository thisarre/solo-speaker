import type { Locale } from "@/i18n/routing";

/**
 * Langue de transcription du mémo vocal, déduite du locale RÉEL de la session.
 * Audit 2026-07-18, reco UX-1 (Critique) : la valeur était codée en dur à "FR",
 * cassant la promesse bilingue dès la première interaction vocale d'un
 * utilisateur anglophone (/en/talks/new).
 */
export function voiceMemoLanguageForLocale(locale: Locale): "FR" | "EN" {
  return locale === "en" ? "EN" : "FR";
}
