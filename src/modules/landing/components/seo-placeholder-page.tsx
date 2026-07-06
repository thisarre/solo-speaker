import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { buttonClassName } from "@/components/ui/Button";
import { getSeoPage, type SeoPageContent, type SeoPageKey } from "@/modules/landing/seo-pages";
import { absoluteUrl, siteUrl } from "@/modules/landing/seo";
import { getMessages } from "@/i18n/messages";
import { localizedPath, type Locale } from "@/i18n/routing";
import { LandingFooter } from "./landing-footer";

const RELATED_KEYS: Record<SeoPageKey, SeoPageKey[]> = {
  "ai-speech-writer": ["public-speaking", "training-presentations"],
  "teleprompter-mode": ["public-speaking", "sermon-preparation"],
  "public-speaking": ["ai-speech-writer", "teleprompter-mode"],
  "sermon-preparation": ["ai-speech-writer", "teleprompter-mode"],
  "training-presentations": ["ai-speech-writer", "teleprompter-mode"],
};

export function SeoPlaceholderPage({ locale = "en", page }: { locale?: Locale; page: SeoPageContent }) {
  const messages = getMessages(locale);
  const seoPages = messages.seoPages;

  const pageUrl = absoluteUrl(localizedPath(page.slug, locale), siteUrl);
  const homeUrl = absoluteUrl(localizedPath("/", locale), siteUrl);
  const isFeature = page.slug.startsWith("/features/");
  const parentName = isFeature ? messages.navigation.features : messages.navigation.useCases;
  const parentAnchor = isFeature ? "#features" : "#use-cases";
  const parentUrl = absoluteUrl(localizedPath(`/${parentAnchor}`, locale), siteUrl);

  const relatedPages = RELATED_KEYS[page.key].map((key) => getSeoPage(locale, key));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: page.title,
        description: page.description,
        url: pageUrl
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: messages.ui.home, item: homeUrl },
          { "@type": "ListItem", position: 2, name: parentName, item: parentUrl },
          { "@type": "ListItem", position: 3, name: page.title, item: pageUrl }
        ]
      },
      // Google rejette un FAQPage sans mainEntity : ne l'émettre que si la page a une FAQ.
      ...(page.faq.length > 0
        ? [
            {
              "@type": "FAQPage",
              mainEntity: page.faq.map(({ q, a }) => ({
                "@type": "Question",
                name: q,
                acceptedAnswer: { "@type": "Answer", text: a }
              }))
            }
          ]
        : [])
    ]
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll("</script>", "<\\/script>") }} type="application/ld+json" />
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 w-full max-w-[1180px] items-center justify-between px-5 md:px-8">
          <Link aria-label={messages.common.appName} href={localizedPath("/", locale)}>
            <Logo />
          </Link>
          <Link className="inline-flex items-center gap-2 text-[13px] font-[550] text-muted transition hover:text-foreground" href={localizedPath("/", locale)}>
            <ArrowLeft className="size-4" />
            {seoPages.backToHome}
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-[1180px] px-5 py-14 md:px-8 md:py-20">
        <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">{page.eyebrow}</p>
        <h1 className="m-0 mt-3 max-w-4xl text-[42px] font-semibold leading-[1.02] tracking-[0] md:text-[64px]">{page.title}</h1>
        <p className="m-0 mt-5 max-w-2xl text-[16px] leading-8 text-muted">{page.description}</p>

        <div className="mt-8 grid gap-5">
          {page.body.map((para, i) => (
            <p className="m-0 max-w-3xl text-[15px] leading-8 text-muted" key={i}>{para}</p>
          ))}
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-[14px] border border-line bg-surface p-5 md:p-6">
            <h2 className="m-0 text-[24px] font-semibold tracking-[0]">{seoPages.coverTitle}</h2>
            <p className="m-0 mt-3 text-[14px] leading-7 text-muted">
              {seoPages.coverBody.replace("{audience}", page.audience)}
            </p>
            <div className="mt-5 grid gap-2">
              {page.highlights.map((highlight) => (
                <div className="flex items-start gap-2 rounded-[8px] border border-line bg-panel p-3" key={highlight}>
                  <Check className="mt-0.5 size-4 shrink-0 text-accent-ink" />
                  <span className="text-[13.5px] leading-6 text-muted">{highlight}</span>
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-[14px] border border-[color-mix(in_oklab,var(--accent)_24%,var(--line))] bg-[color-mix(in_oklab,var(--accent)_6%,var(--surface))] p-5">
            <h2 className="m-0 text-[20px] font-semibold tracking-[0]">{seoPages.tryTitle}</h2>
            <p className="m-0 mt-2 text-[13.5px] leading-6 text-muted">
              {seoPages.tryBody}
            </p>
            <Link className={buttonClassName({ className: "mt-5 w-full", variant: "primary" })} href={localizedPath("/signup?plan=trial", locale)}>
              {messages.common.startFreeTrial}
            </Link>
          </aside>
        </div>

        {page.faq.length > 0 ? (
          <section className="mt-14">
            <h2 className="m-0 text-[28px] font-semibold tracking-[0]">{seoPages.faqTitle}</h2>
            <div className="mt-6 grid gap-4">
              {page.faq.map(({ q, a }, i) => (
                <div className="rounded-[12px] border border-line bg-surface p-5" key={i}>
                  <h3 className="m-0 text-[16px] font-semibold">{q}</h3>
                  <p className="m-0 mt-2 text-[14px] leading-7 text-muted">{a}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-14">
          <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">{seoPages.relatedTitle}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPages.map((related) => (
              <Link
                className="rounded-[12px] border border-line bg-surface p-4 transition hover:border-[color-mix(in_oklab,var(--accent)_40%,var(--line))] hover:bg-[color-mix(in_oklab,var(--accent)_4%,var(--surface))]"
                href={localizedPath(related.slug, locale)}
                key={related.key}
              >
                <p className="m-0 font-mono text-[9px] uppercase tracking-[.12em] text-faint">{related.eyebrow}</p>
                <p className="m-0 mt-1 text-[14px] font-[550]">{related.title}</p>
                <p className="m-0 mt-1 line-clamp-2 text-[13px] leading-6 text-muted">{related.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </section>

      <LandingFooter locale={locale} />
    </main>
  );
}
