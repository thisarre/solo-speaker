import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

// Deliberate assistant generations included in the free trial. Studio/team are unlimited.
export const trialAiCredits = 20;

// Consumes one trial AI credit for a deliberate assistant action. Studio/team are always allowed.
// Fails OPEN (allowed) on any error — e.g. before the ai_credits_used migration is applied — so the
// assistant never breaks; the limit simply isn't enforced until the column exists.
export async function consumeAssistantAiCredit(supabase: SupabaseClient<Database>, userId: string): Promise<{ allowed: boolean }> {
  try {
    const { data } = await supabase.from("profiles").select("billing_plan, ai_credits_used").eq("id", userId).maybeSingle();
    if (!data || data.billing_plan !== "trial") return { allowed: true };

    const used = data.ai_credits_used ?? 0;
    if (used >= trialAiCredits) return { allowed: false };

    try {
      await createAdminClient().from("profiles").update({ ai_credits_used: used + 1 }).eq("id", userId);
    } catch {
      // Increment is best-effort; never fail the request over it.
    }

    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}
