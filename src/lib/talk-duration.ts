/**
 * Durée cible d'un talk saisie à la CRÉATION (audit 2026-07-18, reco UX-4) :
 * elle n'était demandable qu'après coup, dans l'éditeur. Parse défensif d'une
 * valeur de formulaire (entrée utilisateur non fiable) : entier borné 1..600
 * minutes, repli sur le défaut produit (10) si vide/invalide.
 */
export const DEFAULT_TALK_DURATION_MINUTES = 10;

export function parseTalkDurationMinutes(raw: unknown, fallback = DEFAULT_TALK_DURATION_MINUTES): number {
  const value = Math.round(Number(typeof raw === "string" ? raw.trim() : raw));
  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.min(600, value);
}
