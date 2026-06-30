import { createAdminClient } from "@/lib/supabase/admin";
import type { BillingPlan } from "./entitlements";
import { sttCapFor } from "./capabilities";

export type SubscriptionPeriod = {
  stripe_subscription_id: string | null;
  current_period_start: string | null;
};

export function resolvePeriodKey(plan: BillingPlan, period: SubscriptionPeriod | null): string {
  if (plan === "trial") return "trial";
  if (!period?.stripe_subscription_id || !period.current_period_start) return "pending";
  const epoch = Math.floor(new Date(period.current_period_start).getTime() / 1000);
  return `sub:${period.stripe_subscription_id}:${epoch}`;
}

export function capSecondsFor(plan: BillingPlan): number {
  return sttCapFor(plan).minutes * 60;
}

export type ActivePlan = {
  plan: BillingPlan;
  periodKey: string;
  capSeconds: number;
};

// A team member (profiles.team_id set) resolves to 'team' with the cap applied to THEIR OWN
// user_id; the period_key derives from the OWNER's subscription (members have no subscriptions row).
export async function getActivePlan(userId: string): Promise<ActivePlan> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("billing_plan, team_id")
    .eq("id", userId)
    .maybeSingle();

  const plan = (profile?.billing_plan ?? "trial") as BillingPlan;

  if (plan === "trial") {
    return { plan, periodKey: "trial", capSeconds: capSecondsFor("trial") };
  }

  let ownerId = userId;
  if (plan === "team" && profile?.team_id) {
    const { data: team } = await admin.from("teams").select("owner_id").eq("id", profile.team_id).maybeSingle();
    if (team?.owner_id) ownerId = team.owner_id;
  }

  const { data: sub } = await admin
    .from("subscriptions")
    .select("stripe_subscription_id, current_period_start")
    .eq("user_id", ownerId)
    .maybeSingle();

  return {
    plan,
    periodKey: resolvePeriodKey(plan, sub ?? null),
    capSeconds: capSecondsFor(plan)
  };
}
