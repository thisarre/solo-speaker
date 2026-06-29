import { getMessages } from "@/i18n/messages";
import { localizedPath, type Locale } from "@/i18n/routing";

export type PricingPlan = {
  id: "starter" | "studio" | "team";
  name: string;
  audience: string;
  price: string;
  cadence: string;
  description: string;
  highlighted?: boolean;
  ctaLabel: string;
  ctaHref: string;
  checkoutPlan?: "studio_monthly" | "studio_yearly" | "team_monthly" | "team_yearly";
  features: string[];
  monthlyEquivalent?: number;
  secondaryPrice?: {
    badge: string;
    cadence: string;
    price: string;
  };
};

// Monthly equivalent of an annual price, rounded (e.g. "99 EUR" → 8, "240 EUR" → 20).
function monthlyEquivalentFromAnnual(price: string, cadence: string): number | undefined {
  if (!/an|year/i.test(cadence)) return undefined;
  const amount = Number(price.replace(/[^\d]/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  return Math.round(amount / 12);
}

export function getPricingPlans(locale: Locale): PricingPlan[] {
  const messages = getMessages(locale);
  const planCopy = messages.pricing.plans;

  return [
    {
      id: "starter",
      name: planCopy[0].name,
      audience: planCopy[0].audience,
      price: planCopy[0].price,
      cadence: planCopy[0].cadence,
      description: planCopy[0].description,
      ctaLabel: messages.common.startFreeTrial,
      ctaHref: localizedPath("/signup?plan=trial", locale),
      features: planCopy[0].features
    },
    {
      id: "studio",
      name: planCopy[1].name,
      audience: planCopy[1].audience,
      price: planCopy[1].price,
      cadence: planCopy[1].cadence,
      description: planCopy[1].description,
      highlighted: true,
      ctaLabel: planCopy[1].ctaLabel ?? messages.common.startFreeTrial,
      ctaHref: "/api/billing/checkout",
      checkoutPlan: "studio_yearly",
      secondaryPrice: planCopy[1].secondaryPrice,
      features: planCopy[1].features,
      monthlyEquivalent: monthlyEquivalentFromAnnual(planCopy[1].price, planCopy[1].cadence)
    },
    {
      id: "team",
      name: planCopy[2].name,
      audience: planCopy[2].audience,
      price: planCopy[2].price,
      cadence: planCopy[2].cadence,
      description: planCopy[2].description,
      highlighted: false,
      ctaLabel: planCopy[2].ctaLabel ?? messages.common.startFreeTrial,
      ctaHref: "/api/billing/checkout",
      checkoutPlan: "team_yearly",
      secondaryPrice: planCopy[2].secondaryPrice,
      features: planCopy[2].features,
      monthlyEquivalent: monthlyEquivalentFromAnnual(planCopy[2].price, planCopy[2].cadence)
    }
  ];
}

export type BillingCycle = "monthly" | "yearly";

export type PricingCard = {
  id: PricingPlan["id"];
  name: string;
  audience: string;
  description: string;
  features: string[];
  highlighted: boolean;
  isTrial: boolean;
  ctaLabel: string;
  monthly: { price: string; cadence: string };
  yearly: { price: string; cadence: string; savings: string };
};

// Serializable plan cards for the client-side billing-cycle toggle. Annual price is the plan's
// primary price; monthly comes from `secondaryPrice`. The starter is a free trial (no cycle).
export function getPricingCards(locale: Locale): PricingCard[] {
  return getPricingPlans(locale).map((plan) => ({
    id: plan.id,
    name: plan.name,
    audience: plan.audience,
    description: plan.description,
    features: plan.features,
    highlighted: Boolean(plan.highlighted),
    isTrial: !plan.secondaryPrice,
    ctaLabel: plan.ctaLabel,
    monthly: plan.secondaryPrice
      ? { price: plan.secondaryPrice.price, cadence: plan.secondaryPrice.cadence }
      : { price: plan.price, cadence: plan.cadence },
    yearly: { price: plan.price, cadence: plan.cadence, savings: plan.secondaryPrice?.badge ?? "" }
  }));
}

export const pricingPlans = getPricingPlans("fr");
