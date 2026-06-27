import { getMessages } from "@/i18n/messages";

export const trialTalkLimit = 5;

export type BillingPlan = "trial" | "studio" | "team";

export function canCreateTalk(input: { currentTalkCount: number; plan: BillingPlan }) {
  if (input.plan === "studio" || input.plan === "team") {
    return { allowed: true, reason: "" };
  }

  if (input.currentTalkCount >= trialTalkLimit) {
    return {
      allowed: false,
      reason: getMessages("fr").errors.trialTalkLimit
    };
  }

  return { allowed: true, reason: "" };
}
