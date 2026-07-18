"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import type { BillingPlan } from "@/modules/billing/entitlements";
import { aiCreditsGaugeModel, type AiCreditsGauge } from "@/modules/billing/ai-credits-gauge";

/**
 * Crédits IA restants de l'utilisateur courant (audit 2026-07-18, reco UX-2).
 * Lit profiles.billing_plan + ai_credits_used via le client navigateur (grant
 * SELECT + policy profiles_select_own existants — aucune API neuve). `refresh`
 * est appelé après chaque action assistant pour suivre la consommation.
 */
export function useAiCredits(): { gauge: AiCreditsGauge; refresh: () => void } {
  const [state, setState] = useState<{ plan: BillingPlan | null; used: number | null }>({ plan: null, used: null });

  const refresh = useCallback(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user }
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("profiles")
          .select("billing_plan, ai_credits_used")
          .eq("id", user.id)
          .maybeSingle();
        if (!cancelled && data) {
          setState({ plan: (data.billing_plan ?? null) as BillingPlan | null, used: data.ai_credits_used ?? 0 });
        }
      } catch {
        // Silencieux : la jauge est informative, elle ne doit jamais casser l'éditeur.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { gauge: aiCreditsGaugeModel(state), refresh };
}
