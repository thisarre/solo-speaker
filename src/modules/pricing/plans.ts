import { getMessages } from "@/i18n/messages";
import { localizedPath, type Locale } from "@/i18n/routing";

export type PlanId = "studio" | "pro" | "team";

export type PricingPlan = {
  id: PlanId;
  name: string;
  audience: string;
  price: string;
  cadence: string;
  description: string;
  highlighted?: boolean;
  ctaLabel: string;
  ctaHref: string;
  checkoutPlan: "studio_monthly" | "studio_yearly" | "pro_monthly" | "pro_yearly" | "team_monthly" | "team_yearly";
  features: string[];
  perSeat: boolean;
  minSeats?: number;
  groupFraming?: string;
  monthlyEquivalent?: number;
  secondaryPrice: {
    badge: string;
    cadence: string;
    price: string;
  };
};

// Monthly equivalent of an annual price, rounded (e.g. "99 EUR" → 8, "159 EUR" → 13).
function monthlyEquivalentFromAnnual(price: string, cadence: string): number | undefined {
  if (!/an|year/i.test(cadence)) return undefined;
  const amount = Number(price.replace(/[^\d]/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  return Math.round(amount / 12);
}

const MIN_TEAM_SEATS = 3;

export function getPricingPlans(locale: Locale): PricingPlan[] {
  const messages = getMessages(locale);
  const planCopy = messages.pricing.plans;

  const byId = Object.fromEntries(planCopy.map((plan) => [plan.id, plan]));
  const studioCopy = byId.studio;
  const proCopy = byId.pro;
  const teamCopy = byId.team;

  return [
    {
      id: "studio",
      name: studioCopy.name,
      audience: studioCopy.audience,
      price: studioCopy.price,
      cadence: studioCopy.cadence,
      description: studioCopy.description,
      highlighted: true,
      ctaLabel: studioCopy.ctaLabel ?? messages.common.startFreeTrial,
      ctaHref: "/api/billing/checkout",
      checkoutPlan: "studio_yearly",
      secondaryPrice: studioCopy.secondaryPrice,
      features: studioCopy.features,
      perSeat: false,
      monthlyEquivalent: monthlyEquivalentFromAnnual(studioCopy.price, studioCopy.cadence)
    },
    {
      id: "pro",
      name: proCopy.name,
      audience: proCopy.audience,
      price: proCopy.price,
      cadence: proCopy.cadence,
      description: proCopy.description,
      highlighted: false,
      ctaLabel: proCopy.ctaLabel ?? messages.common.startFreeTrial,
      ctaHref: "/api/billing/checkout",
      checkoutPlan: "pro_yearly",
      secondaryPrice: proCopy.secondaryPrice,
      features: proCopy.features,
      perSeat: false,
      monthlyEquivalent: monthlyEquivalentFromAnnual(proCopy.price, proCopy.cadence)
    },
    {
      id: "team",
      name: teamCopy.name,
      audience: teamCopy.audience,
      price: teamCopy.price,
      cadence: teamCopy.cadence,
      description: teamCopy.description,
      highlighted: false,
      ctaLabel: teamCopy.ctaLabel ?? messages.common.startFreeTrial,
      ctaHref: "/api/billing/checkout",
      checkoutPlan: "team_yearly",
      secondaryPrice: teamCopy.secondaryPrice,
      features: teamCopy.features,
      perSeat: true,
      minSeats: MIN_TEAM_SEATS,
      groupFraming: teamCopy.groupFraming,
      monthlyEquivalent: monthlyEquivalentFromAnnual(teamCopy.price, teamCopy.cadence)
    }
  ];
}

export type BillingCycle = "monthly" | "yearly";

export type PricingCard = {
  id: PlanId;
  name: string;
  audience: string;
  description: string;
  features: string[];
  highlighted: boolean;
  perSeat: boolean;
  minSeats?: number;
  groupFraming?: string;
  ctaLabel: string;
  monthly: { price: string; cadence: string };
  yearly: { price: string; cadence: string; savings: string };
};

// Serializable plan cards for the client-side billing-cycle toggle. Yearly price is the plan's
// primary price; monthly comes from `secondaryPrice`. Team prices are PER SEAT.
export function getPricingCards(locale: Locale): PricingCard[] {
  return getPricingPlans(locale).map((plan) => ({
    id: plan.id,
    name: plan.name,
    audience: plan.audience,
    description: plan.description,
    features: plan.features,
    highlighted: Boolean(plan.highlighted),
    perSeat: plan.perSeat,
    minSeats: plan.minSeats,
    groupFraming: plan.groupFraming,
    ctaLabel: plan.ctaLabel,
    monthly: { price: plan.secondaryPrice.price, cadence: plan.secondaryPrice.cadence },
    yearly: { price: plan.price, cadence: plan.cadence, savings: plan.secondaryPrice.badge }
  }));
}

export function getTrialCta(locale: Locale): string {
  return getMessages(locale).pricing.trialCta;
}

export const pricingPlans = getPricingPlans("fr");

// Re-export for callers that still reference the localized trial path.
export function trialHref(locale: Locale): string {
  return localizedPath("/signup?plan=trial", locale);
}
