"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { localizedPath, type Locale } from "@/i18n/routing";
import { TrackedLinkButton } from "@/modules/landing/components/tracked-link-button";
import type { BillingCycle, PricingCard } from "@/modules/pricing/plans";

type PricingCardsProps = {
  cards: PricingCard[];
  labels: { monthly: string; recommended: string; yearly: string };
  locale: Locale;
};

export function PricingCards({ cards, labels, locale }: PricingCardsProps) {
  const [cycle, setCycle] = useState<BillingCycle>("yearly");

  return (
    <div data-scroll-reveal>
      <div className="inline-flex rounded-full border border-line bg-surface p-1" role="group">
        {(["yearly", "monthly"] as const).map((value) => (
          <button
            aria-pressed={cycle === value}
            className={`rounded-full px-4 py-1.5 text-[13px] font-[550] transition ${
              cycle === value ? "bg-accent text-white" : "text-muted hover:text-foreground"
            }`}
            key={value}
            onClick={() => setCycle(value)}
            type="button"
          >
            {value === "yearly" ? labels.yearly : labels.monthly}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const pricing = card.isTrial ? card.yearly : card[cycle];
          const showSavings = !card.isTrial && cycle === "yearly" && Boolean(card.yearly.savings);
          return (
            <div
              className={`relative flex flex-col rounded-[12px] border bg-surface p-5 ${
                card.highlighted ? "border-accent shadow-[0_18px_50px_rgba(20,20,25,.08)]" : "border-line"
              }`}
              key={card.id}
            >
              {card.highlighted ? (
                <span className="absolute -top-2.5 left-5 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold text-white">{labels.recommended}</span>
              ) : null}
              <p className="m-0 text-[14px] font-semibold tracking-[0]">{card.name}</p>
              <p className="m-0 mt-0.5 text-[12px] text-faint">{card.audience}</p>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-[30px] font-bold leading-none">{pricing.price}</span>
                <span className="text-[13px] text-muted">{pricing.cadence}</span>
              </div>
              <p className={`m-0 mt-1.5 text-[12px] text-accent-ink ${showSavings ? "" : "invisible"}`}>{card.yearly.savings || "—"}</p>
              <ul className="m-0 mt-3 grid flex-1 list-none gap-2 p-0">
                {card.features.slice(0, 4).map((feature) => (
                  <li className="flex items-start gap-2 text-[13px] leading-5 text-muted" key={feature}>
                    <Check className="mt-0.5 size-4 shrink-0 text-accent-ink" />
                    {feature}
                  </li>
                ))}
              </ul>
              <TrackedLinkButton
                className="mt-5 h-10 w-full rounded-[8px]"
                event="pricing_cta_clicked"
                href={card.isTrial ? localizedPath("/signup?plan=trial", locale) : `/api/billing/checkout?plan=${card.id}_${cycle}&locale=${locale}`}
                properties={{ cycle, location: "pricing_preview", plan: card.id }}
                variant={card.highlighted ? "primary" : undefined}
              >
                {card.ctaLabel}
              </TrackedLinkButton>
            </div>
          );
        })}
      </div>
    </div>
  );
}
