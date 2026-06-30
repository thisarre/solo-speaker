"use client";

import { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { type Locale } from "@/i18n/routing";
import { TrackedLinkButton } from "@/modules/landing/components/tracked-link-button";
import type { BillingCycle, PricingCard } from "@/modules/pricing/plans";

type PricingCardsProps = {
  cards: PricingCard[];
  labels: {
    monthly: string;
    recommended: string;
    yearly: string;
    perSeatTotalYearly: string;
    perSeatTotalMonthly: string;
    seatsLabel: string;
    increaseSeats: string;
    decreaseSeats: string;
  };
  locale: Locale;
};

// Parse the integer euros out of a price string like "49 EUR" → 49.
function eurosOf(price: string): number {
  return Number(price.replace(/[^\d]/g, ""));
}

export function PricingCards({ cards, labels, locale }: PricingCardsProps) {
  const [cycle, setCycle] = useState<BillingCycle>("yearly");
  const [seatsByCard, setSeatsByCard] = useState<Record<string, number>>({});

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
          const pricing = card[cycle];
          const showSavings = cycle === "yearly" && Boolean(card.yearly.savings);
          const minSeats = card.minSeats ?? 1;
          const seats = card.perSeat ? seatsByCard[card.id] ?? minSeats : 1;
          const perSeatAmount = eurosOf(pricing.price);
          // The headline price is always the PER-SEAT amount (e.g. "49 EUR"); the localized cadence
          // string already states the per-seat period. The seat multiplier only feeds the secondary total.
          const displayPrice = pricing.price;
          const cadence = pricing.cadence;
          const seatTotalLabel = card.perSeat
            ? (cycle === "yearly" ? labels.perSeatTotalYearly : labels.perSeatTotalMonthly)
                .replaceAll("{total}", String(perSeatAmount * seats))
                .replaceAll("{seats}", String(seats))
            : "";
          const href = card.perSeat
            ? `/api/billing/checkout?plan=${card.id}_${cycle}&seats=${seats}&locale=${locale}`
            : `/api/billing/checkout?plan=${card.id}_${cycle}&locale=${locale}`;

          const setSeats = (next: number) =>
            setSeatsByCard((prev) => ({ ...prev, [card.id]: Math.max(minSeats, next) }));

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
                <span className="text-[30px] font-bold leading-none">{displayPrice}</span>
                <span className="text-[13px] text-muted">{cadence}</span>
              </div>
              {card.perSeat ? (
                <p className="m-0 mt-1 text-[12px] text-muted">{seatTotalLabel}</p>
              ) : null}
              <p className={`m-0 mt-1.5 text-[12px] text-accent-ink ${showSavings ? "" : "invisible"}`}>{card.yearly.savings || " "}</p>

              {card.perSeat ? (
                <div className="mt-2">
                  {card.groupFraming ? (
                    <p className="m-0 mb-2 text-[11.5px] leading-4 text-faint">{card.groupFraming}</p>
                  ) : null}
                  <div className="inline-flex items-center gap-2 rounded-[8px] border border-line bg-background p-1">
                    <button
                      aria-label={labels.decreaseSeats}
                      className="inline-flex size-7 items-center justify-center rounded-[6px] text-muted transition hover:text-foreground disabled:opacity-40"
                      disabled={seats <= minSeats}
                      onClick={() => setSeats(seats - 1)}
                      type="button"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span aria-live="polite" className="min-w-[3.5rem] text-center text-[13px] font-[550]">
                      {seats} {labels.seatsLabel}
                    </span>
                    <button
                      aria-label={labels.increaseSeats}
                      className="inline-flex size-7 items-center justify-center rounded-[6px] text-muted transition hover:text-foreground"
                      onClick={() => setSeats(seats + 1)}
                      type="button"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </div>
              ) : null}

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
                href={href}
                properties={{ cycle, location: "pricing_preview", plan: card.id, seats }}
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
