import type { BillingPlan } from "./entitlements";

export type Capability =
  | "export.branded"
  | "analytics.rehearsal"
  | "talk.versions"
  | "talk.multilingual"
  | "share.public"
  | "team.seats"
  | "team.sharedLibrary";

export type SttCap = { minutes: number; basis: "trial_total" | "billing_period" };

type PlanEntry = {
  capabilities: ReadonlySet<Capability>;
  stt: SttCap;
  talkLimit: number | "unlimited";
  aiCredits: number | "unlimited";
};

const PRO_CAPS: Capability[] = ["export.branded", "analytics.rehearsal", "talk.versions", "talk.multilingual", "share.public"];

export const PLAN_CAPABILITIES: Record<BillingPlan, PlanEntry> = {
  trial: {
    capabilities: new Set(),
    stt: { minutes: 15, basis: "trial_total" },
    talkLimit: 5,
    aiCredits: 20
  },
  studio: {
    capabilities: new Set(),
    stt: { minutes: 60, basis: "billing_period" },
    talkLimit: "unlimited",
    aiCredits: "unlimited"
  },
  pro: {
    capabilities: new Set(PRO_CAPS),
    stt: { minutes: 90, basis: "billing_period" },
    talkLimit: "unlimited",
    aiCredits: "unlimited"
  },
  team: {
    capabilities: new Set<Capability>([...PRO_CAPS, "team.seats", "team.sharedLibrary"]),
    stt: { minutes: 90, basis: "billing_period" },
    talkLimit: "unlimited",
    aiCredits: "unlimited"
  }
};

// The single server-side gate. Replaces scattered `plan === "studio"` checks.
export function can(plan: BillingPlan, capability: Capability): boolean {
  return PLAN_CAPABILITIES[plan].capabilities.has(capability);
}

export function sttCapFor(plan: BillingPlan): SttCap {
  return PLAN_CAPABILITIES[plan].stt;
}
