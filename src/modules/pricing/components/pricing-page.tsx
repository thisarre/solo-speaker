import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { buttonClassName } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { getMessages } from "@/i18n/messages";
import { localizedPath, type Locale } from "@/i18n/routing";
import { getPricingCards } from "../plans";
import { PricingCards } from "./pricing-cards";
import { PricingTracker } from "./pricing-tracker";

export function PricingPage({ locale = "en", returnHref = "/" }: { locale?: Locale; returnHref?: string }) {
  const messages = getMessages(locale);
  const pricing = messages.pricing;
  const cards = getPricingCards(locale);
  const localizedReturnHref = returnHref.startsWith("/") ? localizedPath(returnHref, locale) : returnHref;
  const returnLabel = returnHref.includes("/dashboard") ? pricing.returnToStudio : pricing.return;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <PricingTracker />
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 w-full max-w-[1480px] items-center justify-between px-5 md:px-8">
          <Link aria-label={messages.common.appName} href={localizedReturnHref}>
            <Logo label={messages.common.brandShort} />
          </Link>
          <Link className="inline-flex items-center gap-2 text-[13px] font-[550] text-muted transition hover:text-foreground" href={localizedReturnHref}>
            <ArrowLeft className="size-4" />
            {returnLabel}
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-[1480px] px-5 py-12 md:px-8 md:py-16">
        <div className="max-w-3xl">
          <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">{pricing.eyebrow}</p>
          <h1 className="m-0 mt-3 text-[42px] font-semibold leading-[1.02] tracking-[0] md:text-[64px]">{pricing.title}</h1>
          <p className="m-0 mt-5 max-w-2xl text-[16px] leading-8 text-muted">
            {pricing.description}
          </p>
        </div>

        <div className="mt-9 rounded-[14px] border border-accent bg-[color-mix(in_oklab,var(--accent)_7%,var(--surface))] p-5 md:p-6">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div>
              <p className="m-0 flex flex-wrap items-center gap-1.5 text-[13px] font-semibold text-accent-ink">
                <Sparkles className="size-4" />
                {pricing.trialCta}
              </p>
              <p className="m-0 mt-1.5 text-[12.5px] text-muted">{pricing.riskReversal}</p>
            </div>
            <Link
              className={buttonClassName({ className: "overflow-hidden text-ellipsis max-w-full", variant: "primary" })}
              href={localizedPath("/signup?plan=trial", locale)}
            >
              {pricing.trialCta}
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <PricingCards
            cards={cards}
            labels={{
              monthly: pricing.cycleMonthly,
              recommended: pricing.recommended,
              yearly: pricing.cycleYearly,
              perSeatTotalYearly: pricing.perSeatTotalYearly,
              perSeatTotalMonthly: pricing.perSeatTotalMonthly,
              seatsLabel: pricing.seatsLabel,
              increaseSeats: pricing.increaseSeats,
              decreaseSeats: pricing.decreaseSeats
            }}
            locale={locale}
          />
        </div>

        <section className="mt-8 rounded-[14px] border border-line bg-panel p-5 md:p-6">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div>
              <h2 className="m-0 text-[20px] font-semibold tracking-[0]">{pricing.productionTitle}</h2>
              <p className="m-0 mt-2 max-w-2xl text-[13.5px] leading-6 text-muted">
                {pricing.productionBody}
              </p>
            </div>
            <form action="/api/billing/checkout" method="post">
              <input name="plan" type="hidden" value="studio_yearly" />
              <input name="locale" type="hidden" value={locale} />
              <button className={buttonClassName({ variant: "primary" })} type="submit">
                {pricing.prepareStudio}
              </button>
            </form>
          </div>
        </section>
      </section>
    </main>
  );
}
