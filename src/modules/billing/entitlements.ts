import { getMessages } from "@/i18n/messages";
import { PLAN_CAPABILITIES } from "./capabilities";

export type BillingPlan = "trial" | "studio" | "pro" | "team";

// Back-compat export kept for existing imports/tests.
export const trialTalkLimit = 5;

export function canCreateTalk(input: { currentTalkCount: number; plan: BillingPlan }) {
  const limit = PLAN_CAPABILITIES[input.plan].talkLimit;
  if (limit === "unlimited") {
    return { allowed: true, reason: "" };
  }
  if (input.currentTalkCount >= limit) {
    return { allowed: false, reason: getMessages("fr").errors.trialTalkLimit };
  }
  return { allowed: true, reason: "" };
}

export { can, sttCapFor } from "./capabilities";
export type { Capability } from "./capabilities";
