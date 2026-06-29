import Link from "next/link";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { buttonClassName } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { getMessages } from "@/i18n/messages";
import { localizedPath, type Locale } from "@/i18n/routing";
import { getPricingPlans } from "../plans";
import { PricingTracker } from "./pricing-tracker";

export function PricingPage({ locale = "en", returnHref = "/" }: { locale?: Locale; returnHref?: string }) {
  const messages = getMessages(locale);
  const pricing = messages.pricing;
  const plans = getPricingPlans(locale);
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

        <div className="mt-9 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              className={`relative flex min-h-[520px] flex-col rounded-[14px] border p-5 shadow-[0_1px_2px_rgba(20,20,25,.04)] ${
                plan.highlighted ? "border-accent bg-[color-mix(in_oklab,var(--accent)_7%,var(--surface))]" : "border-line bg-surface"
              }`}
              key={plan.id}
            >
              {plan.highlighted ? (
                <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-[7px] bg-accent px-2 py-1 text-[11px] font-semibold text-white">
                  <Sparkles className="size-3" />
                  {pricing.recommended}
                </span>
              ) : null}
              <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">{plan.audience}</p>
              <h2 className="m-0 mt-3 text-[24px] font-semibold tracking-[0]">{plan.name}</h2>
              <div className="mt-5 flex items-end gap-2">
                <p className="m-0 text-[38px] font-semibold leading-none tracking-[0]">{plan.price}</p>
                <p className="m-0 pb-1 text-[12.5px] text-muted">{plan.cadence}</p>
              </div>
              {plan.monthlyEquivalent ? (
                <p className="m-0 mt-1 text-[12px] text-faint">
                  {pricing.perMonthEquivalent.replace("{amount}", String(plan.monthlyEquivalent))}
                </p>
              ) : null}
              {plan.secondaryPrice ? (
                <div className="mt-3 rounded-[9px] border border-[color-mix(in_oklab,var(--accent)_22%,var(--line))] bg-surface px-3 py-2">
                  <p className="m-0 text-[13px] font-semibold text-foreground">
                    {plan.secondaryPrice.price} <span className="font-normal text-muted">{plan.secondaryPrice.cadence}</span>
                  </p>
                  <p className="m-0 mt-0.5 text-[11.5px] font-[550] text-accent-ink">{plan.secondaryPrice.badge}</p>
                </div>
              ) : null}
              <p className="m-0 mt-4 text-[13.5px] leading-6 text-muted">{plan.description}</p>
              {plan.checkoutPlan ? (
                <form action={plan.ctaHref} className="mt-5" method="post">
                  <input name="plan" type="hidden" value={plan.checkoutPlan} />
                  <input name="locale" type="hidden" value={locale} />
                  <button className={buttonClassName({ className: "w-full", variant: plan.highlighted ? "primary" : "ghost" })} type="submit">
                    {plan.ctaLabel}
                  </button>
                </form>
              ) : (
                <Link className={buttonClassName({ className: "mt-5 w-full", variant: plan.highlighted ? "primary" : "ghost" })} href={plan.ctaHref}>
                  {plan.ctaLabel}
                </Link>
              )}
              <div className="mt-6 grid gap-2 border-t border-line pt-5">
                {plan.features.map((feature) => (
                  <div className="flex items-start gap-2 text-[13px] leading-6 text-muted" key={feature}>
                    <Check className="mt-1 size-3.5 shrink-0 text-accent-ink" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        <p className="mt-5 text-center text-[12.5px] text-faint">{pricing.riskReversal}</p>

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
