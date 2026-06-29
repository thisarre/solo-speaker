import Link from "next/link";
import { ArrowRight, CalendarClock, Check, FileText, Menu, Mic2, PanelsTopLeft, Sparkles, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { LandingMotion } from "@/modules/landing/components/landing-motion";
import { LandingVideoShowcase } from "@/modules/landing/components/landing-video-showcase";
import { LandingFooter } from "@/modules/landing/components/landing-footer";
import { ProductPreview } from "@/modules/landing/components/product-preview";
import { landingFaq } from "@/modules/landing/seo";
import { getPricingCards } from "@/modules/pricing/plans";
import { PricingCards } from "@/modules/pricing/components/pricing-cards";
import type { Locale } from "@/i18n/routing";
import { localizedPath } from "@/i18n/routing";
import { getMessages } from "@/i18n/messages";
import { TrackedCardLink } from "./tracked-card-link";
import { TrackedLinkButton } from "./tracked-link-button";

const workflowIcons = [PanelsTopLeft, Wand2, Mic2];

export function LandingPage({ locale }: { locale: Locale }) {
  const messages = getMessages(locale);
  const common = messages.common;
  const navigation = messages.navigation;
  const landing = messages.landing;
  const faq = landingFaq[locale];
  const pricingCards = getPricingCards(locale);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <LandingMotion />

      <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-[1480px] items-center justify-between px-5 md:px-8">
          <Link aria-label={common.appName} href={localizedPath("/", locale)}>
            <Logo />
          </Link>
          <nav className="hidden items-center gap-6 text-[13px] font-[550] text-muted md:flex">
            <a className="transition hover:text-foreground" href="#solution">{navigation.studio}</a>
            <a className="transition hover:text-foreground" href="#features">{navigation.features}</a>
            <a className="transition hover:text-foreground" href="#use-cases">{navigation.useCases}</a>
            <a className="transition hover:text-foreground" href="#pricing-preview">{navigation.pricing}</a>
          </nav>
          <div className="flex min-w-0 items-center gap-2">
            <ThemeToggle className="hidden w-[92px] md:inline-grid" />
            <LanguageSwitcher className="hidden md:inline-grid" currentLocale={locale} />
            <Link className="hidden md:block" href={localizedPath("/login", locale)}>
              <span className="inline-flex h-8 items-center rounded-[7px] px-3 text-[13px] font-[550] text-muted transition hover:text-foreground">{navigation.login}</span>
            </Link>
            <TrackedLinkButton className="hidden md:inline-flex" event="landing_cta_clicked" href={localizedPath("/signup?plan=trial", locale)} properties={{ location: "header", cta: "create_talk" }} variant="primary">
              {common.createTalk}
            </TrackedLinkButton>
            <details className="relative md:hidden">
              <summary aria-label={common.menu} className="flex size-9 cursor-pointer list-none items-center justify-center rounded-[8px] border border-line bg-surface text-muted transition hover:text-foreground [&::-webkit-details-marker]:hidden">
                <Menu className="size-4" />
              </summary>
              <div className="absolute right-0 top-11 z-40 grid w-[240px] max-w-[calc(100vw-2.5rem)] gap-1 rounded-[12px] border border-line bg-background p-2 shadow-[0_18px_50px_rgba(20,20,25,.18)]">
                <a className="rounded-[8px] px-3 py-2 text-[13px] font-[550] text-muted transition hover:bg-surface hover:text-foreground" href="#solution">{navigation.studio}</a>
                <a className="rounded-[8px] px-3 py-2 text-[13px] font-[550] text-muted transition hover:bg-surface hover:text-foreground" href="#features">{navigation.features}</a>
                <a className="rounded-[8px] px-3 py-2 text-[13px] font-[550] text-muted transition hover:bg-surface hover:text-foreground" href="#use-cases">{navigation.useCases}</a>
                <a className="rounded-[8px] px-3 py-2 text-[13px] font-[550] text-muted transition hover:bg-surface hover:text-foreground" href="#pricing-preview">{navigation.pricing}</a>
                <div aria-hidden="true" className="my-1 h-px bg-line" />
                <Link className="rounded-[8px] px-3 py-2 text-[13px] font-[550] text-muted transition hover:bg-surface hover:text-foreground" href={localizedPath("/login", locale)}>{navigation.login}</Link>
                <TrackedLinkButton className="mt-1 w-full justify-center" event="landing_cta_clicked" href={localizedPath("/signup?plan=trial", locale)} properties={{ cta: "create_talk", location: "header_mobile" }} variant="primary">
                  {common.createTalk}
                </TrackedLinkButton>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <ThemeToggle className="w-[92px]" />
                  <LanguageSwitcher currentLocale={locale} />
                </div>
              </div>
            </details>
          </div>
        </div>
      </header>

      <section className="border-b border-line">
        <div className="mx-auto grid min-h-[calc(100svh-56px)] w-full max-w-[1480px] items-center gap-10 px-5 py-10 md:px-8 lg:grid-cols-[minmax(0,.9fr)_minmax(500px,1fr)] lg:py-16">
          <div className="max-w-2xl">
            <Badge data-landing-reveal tone="accent">{landing.heroBadge}</Badge>
            <h1 className="m-0 mt-5 text-[44px] font-bold leading-[.96] tracking-[0] md:text-[66px] lg:text-[74px]" data-landing-reveal>
              {landing.heroTitle}
            </h1>
            <p className="m-0 mt-5 max-w-xl text-[17px] leading-8 text-muted" data-landing-reveal>
              {landing.heroSubtitle}
            </p>
            <p className="m-0 mt-4 max-w-xl text-[14px] leading-7 text-muted" data-landing-reveal>
              {landing.heroDefinition}
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-3" data-landing-reveal>
              {landing.timeProofs.map(([label, text]) => (
                <div className="rounded-[8px] border border-line bg-surface p-3" key={label}>
                  <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-accent-ink">{label}</p>
                  <p className="m-0 mt-2 text-[12.5px] leading-5 text-muted">{text}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-[12px] border border-[color-mix(in_oklab,var(--accent)_30%,var(--line))] bg-[color-mix(in_oklab,var(--accent)_6%,var(--surface))] p-4 shadow-[0_16px_48px_rgba(20,20,25,.06)]" data-landing-reveal>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.12em] text-accent-ink">
                    <CalendarClock className="size-3.5" />
                    {landing.trialEyebrow}
                  </div>
                  <p className="m-0 text-[20px] font-semibold tracking-[0] text-foreground">{landing.trialTitle}</p>
                  <p className="m-0 mt-1 text-[13px] leading-6 text-muted">{landing.trialDescription}</p>
                </div>
                <TrackedLinkButton className="h-10 shrink-0 rounded-[8px] px-4" event="hero_cta_clicked" href={localizedPath("/signup?plan=trial", locale)} leftIcon={<ArrowRight />} properties={{ cta: "start_free_trial", location: "hero_trial_panel" }} variant="primary">
                  {common.startFreeTrial}
                </TrackedLinkButton>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {landing.trialHighlights.map((item) => (
                  <span className="rounded-[7px] border border-border bg-surface px-2 py-1 text-[11.5px] font-[550] text-muted" key={item}>{item}</span>
                ))}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3" data-landing-reveal>
              <TrackedLinkButton className="h-10 rounded-[8px] px-4" event="pricing_cta_clicked" href={localizedPath("/signup?plan=trial", locale)} leftIcon={<PanelsTopLeft />} properties={{ location: "hero_secondary" }}>
                {landing.heroSecondaryCta}
              </TrackedLinkButton>
            </div>
            {/* TODO: real customer testimonials */}
            <ul className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1.5 p-0 text-[12px] text-faint" data-landing-reveal>
              {landing.trustStrip.map((chip, index) => (
                <li className="flex list-none items-center gap-2" key={chip}>
                  {index > 0 ? <span aria-hidden="true" className="text-line">·</span> : null}
                  <span>{chip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div data-landing-reveal>
            <ProductPreview />
          </div>
        </div>
      </section>

      <LandingVideoShowcase landing={landing} locale={locale} />

      <section className="border-b border-line py-14 md:py-18" id="problem">
        <div className="mx-auto grid w-full max-w-[1480px] gap-8 px-5 md:px-8 lg:grid-cols-[minmax(0,.72fr)_minmax(360px,.45fr)]">
          <div data-scroll-reveal>
            <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">{landing.problemEyebrow}</p>
            <h2 className="m-0 mt-2 max-w-3xl text-[30px] font-bold leading-tight tracking-[0] md:text-[44px]">{landing.problemTitle}</h2>
            <p className="m-0 mt-4 max-w-3xl text-[15px] leading-7 text-muted">
              {landing.problemBody}
            </p>
          </div>
          <div className="grid gap-2" data-scroll-reveal>
            {landing.problemItems.map((item) => (
              <div className="rounded-[8px] border border-line bg-surface p-4" key={item}>
                <p className="m-0 text-[14px] leading-6 text-muted">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line py-14 md:py-18" id="solution">
        <div className="mx-auto w-full max-w-[1480px] px-5 md:px-8">
          <div className="mb-7 max-w-3xl" data-scroll-reveal>
            <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">{landing.solutionEyebrow}</p>
            <h2 className="m-0 mt-2 text-[30px] font-bold leading-tight tracking-[0] md:text-[42px]">
              {landing.solutionTitle}
            </h2>
            <p className="m-0 mt-4 text-[15px] leading-7 text-muted">
              {landing.solutionBody}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {landing.workflowFeatures.map(([title, text], index) => {
              const Icon = workflowIcons[index] ?? PanelsTopLeft;
              return (
                <article className="rounded-[8px] border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(20,20,25,.04)]" data-scroll-reveal key={title}>
                  <div className="studio-button-primary mb-5 flex size-9 items-center justify-center rounded-[7px]">
                    <Icon className="size-4" />
                  </div>
                  <h3 className="m-0 text-[17px] font-semibold tracking-[0]">{title}</h3>
                  <p className="m-0 mt-2 text-[13.5px] leading-6 text-muted">{text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-panel py-14 md:py-18" id="features">
        <div className="mx-auto w-full max-w-[1480px] px-5 md:px-8">
          <div data-scroll-reveal>
            <Badge tone="neutral">{landing.featuresEyebrow}</Badge>
            <h2 className="m-0 mt-4 max-w-3xl text-[32px] font-bold leading-tight tracking-[0] md:text-[48px]">
              {landing.featuresTitle}
            </h2>
            <p className="m-0 mt-4 max-w-2xl text-[15px] leading-7 text-muted">
              {landing.featuresBody}
            </p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {landing.featureList.map((feature) => (
                <div className="flex items-start gap-2 rounded-[8px] border border-line bg-surface p-3" key={feature}>
                  <Check className="mt-0.5 size-4 shrink-0 text-accent-ink" />
                  <span className="text-[13.5px] leading-6 text-muted">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line py-14 md:py-18" id="use-cases">
        <div className="mx-auto w-full max-w-[1480px] px-5 md:px-8">
          <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between" data-scroll-reveal>
            <div>
              <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">{landing.useCasesEyebrow}</p>
              <h2 className="m-0 mt-2 max-w-2xl text-[30px] font-bold leading-tight md:text-[42px]">{landing.useCasesTitle}</h2>
            </div>
            <p className="m-0 max-w-sm text-[14px] leading-6 text-muted">
              {landing.useCasesBody}
            </p>
          </div>

          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {landing.useCases.map(([title, text, href]) => (
              <TrackedCardLink
                className="group rounded-[8px] border border-line bg-surface p-4 transition hover:border-accent"
                data-scroll-reveal
                event="use_case_clicked"
                href={localizedPath(href, locale)}
                key={title}
                properties={{ use_case: title }}
              >
                <FileText className="mb-4 size-4 text-faint transition group-hover:text-accent-ink" />
                <h3 className="m-0 text-[16px] font-semibold">{title}</h3>
                <p className="m-0 mt-2 text-[13px] leading-6 text-muted">{text}</p>
              </TrackedCardLink>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-panel py-14 md:py-18" id="comparison">
        <div className="mx-auto w-full max-w-[1480px] px-5 md:px-8">
          <div className="mb-7 max-w-3xl" data-scroll-reveal>
            <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">{landing.comparisonEyebrow}</p>
            <h2 className="m-0 mt-2 text-[30px] font-bold leading-tight tracking-[0] md:text-[42px]">{landing.comparisonTitle}</h2>
            <p className="m-0 mt-4 text-[15px] leading-7 text-muted">{landing.comparisonBody}</p>
          </div>
          <div className="overflow-hidden rounded-[10px] border border-line bg-surface" data-scroll-reveal>
            {landing.comparisonRows.map(([tool, good, gap]) => (
              <div className="grid gap-3 border-b border-line p-4 last:border-b-0 md:grid-cols-[180px_minmax(0,.75fr)_minmax(0,1fr)]" key={tool}>
                <h3 className="m-0 text-[15px] font-semibold">{tool}</h3>
                <p className="m-0 text-[13px] leading-6 text-muted">{good}</p>
                <p className="m-0 text-[13px] leading-6 text-muted">{gap}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line py-14 md:py-18" id="founder">
        <div className="mx-auto w-full max-w-[760px] px-5 md:px-8" data-scroll-reveal>
          <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">{landing.founderEyebrow}</p>
          <figure className="m-0 mt-5">
            <blockquote className="m-0 border-l-2 border-accent pl-5 md:pl-6">
              {landing.founderParagraphs.map((paragraph) => (
                <p className="m-0 mb-4 text-[17px] leading-8 text-foreground last:mb-0 md:text-[19px]" key={paragraph.slice(0, 32)}>
                  {paragraph}
                </p>
              ))}
            </blockquote>
            <figcaption className="mt-5 pl-5 text-[14px] font-semibold text-muted md:pl-6">{landing.founderSignature}</figcaption>
          </figure>
        </div>
      </section>

      <section className="border-b border-line py-14 text-foreground md:py-18" id="pricing-preview">
        <div className="mx-auto w-full max-w-[1480px] px-5 md:px-8">
          <div className="max-w-2xl" data-scroll-reveal>
            <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">{landing.pricingEyebrow}</p>
            <h2 className="m-0 mt-3 text-[34px] font-bold leading-tight tracking-[0] md:text-[52px]">{landing.pricingTitle}</h2>
            <p className="m-0 mt-4 text-[15px] leading-7 text-muted">{landing.pricingBody}</p>
          </div>

          <div className="mt-8">
            <PricingCards
              cards={pricingCards}
              labels={{ monthly: messages.pricing.cycleMonthly, recommended: messages.pricing.recommended, yearly: messages.pricing.cycleYearly }}
              locale={locale}
            />
          </div>

          <div className="mt-6">
            <TrackedLinkButton className="h-10 rounded-[8px] px-4" event="pricing_cta_clicked" href={localizedPath("/pricing", locale)} leftIcon={<Sparkles />} properties={{ location: "pricing_preview_all" }}>
              {common.viewPricing}
            </TrackedLinkButton>
          </div>
        </div>
      </section>

      <section className="bg-panel py-14 md:py-18" id="faq">
        <div className="mx-auto w-full max-w-[1480px] px-5 md:px-8">
          <div className="mb-7 max-w-3xl" data-scroll-reveal>
            <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">{landing.faqEyebrow}</p>
            <h2 className="m-0 mt-2 text-[30px] font-bold leading-tight tracking-[0] md:text-[42px]">{landing.faqTitle}</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {faq.map((item) => (
              <article className="rounded-[10px] border border-line bg-surface p-4" data-scroll-reveal key={item.question}>
                <h3 className="m-0 text-[16px] font-semibold tracking-[0]">{item.question}</h3>
                <p className="m-0 mt-2 text-[13.5px] leading-6 text-muted">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter locale={locale} />
    </main>
  );
}
