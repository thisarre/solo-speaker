import type { Metadata } from "next";
import { SeoPlaceholderPage } from "@/modules/landing/components/seo-placeholder-page";
import { getSeoPage, type SeoPageKey } from "@/modules/landing/seo-pages";
import { getMessages } from "@/i18n/messages";
import { getLocalizedPathAlternates, localizedPath, type Locale } from "@/i18n/routing";

export function buildSeoPageMetadata(locale: Locale, key: SeoPageKey): Metadata {
  const page = getSeoPage(locale, key);
  const messages = getMessages(locale);

  return {
    title: `${page.title} — ${messages.common.appName}`,
    description: page.description,
    alternates: {
      canonical: localizedPath(page.slug, locale),
      languages: getLocalizedPathAlternates(page.slug)
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url: localizedPath(page.slug, locale)
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description
    }
  };
}

export function SeoPageRoute({ locale, pageKey }: { locale: Locale; pageKey: SeoPageKey }) {
  return <SeoPlaceholderPage locale={locale} page={getSeoPage(locale, pageKey)} />;
}
