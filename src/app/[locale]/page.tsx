import { LandingPage } from "@/modules/landing/components/landing-page";
import { buildLandingJsonLd, buildLandingMetadata, siteUrl } from "@/modules/landing/seo";
import { locales } from "@/i18n/routing";
import { getLocaleFromParams } from "@/i18n/server";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocalePageProps) {
  return buildLandingMetadata(await getLocaleFromParams(params));
}

export default async function LocaleHomePage({ params }: LocalePageProps) {
  const locale = await getLocaleFromParams(params);
  const jsonLd = buildLandingJsonLd(locale, siteUrl);

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} type="application/ld+json" />
      <LandingPage locale={locale} />
    </>
  );
}
