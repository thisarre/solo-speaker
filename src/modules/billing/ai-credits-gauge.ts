import type { BillingPlan } from "@/modules/billing/entitlements";
import { trialAiCredits } from "@/modules/billing/ai-credits";

/**
 * Modèle PUR de la jauge de crédits IA (audit 2026-07-18, reco UX-2, Critique) :
 * l'utilisateur en Essai découvrait la limite au moment du blocage, sans aucune
 * visibilité en amont. La jauge n'existe que pour le plan trial — les plans
 * payants sont illimités (aucun bruit d'UI pour eux).
 */
export type AiCreditsGauge = {
  visible: boolean;
  used: number;
  total: number;
  remaining: number;
  /** 0..1 — part consommée (pour la barre). */
  ratio: number;
  /** Reste ≤ 20 % du total : signal visuel d'alerte avant le mur. */
  low: boolean;
};

export function aiCreditsGaugeModel(input: { plan: BillingPlan | null; used: number | null }): AiCreditsGauge {
  const total = trialAiCredits;
  if (input.plan !== "trial") {
    return { visible: false, used: 0, total, remaining: total, ratio: 0, low: false };
  }
  const used = Math.max(0, Math.min(total, Math.floor(input.used ?? 0)));
  const remaining = total - used;
  return {
    visible: true,
    used,
    total,
    remaining,
    ratio: used / total,
    low: remaining <= Math.ceil(total * 0.2)
  };
}
