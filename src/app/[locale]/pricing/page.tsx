import type { Metadata } from "next";
import { getUser } from "@/modules/auth/queries";
import { getPricingReturnHref } from "@/modules/pricing/navigation";
import { PricingPage } from "@/modules/pricing/components/pricing-page";
import { getMessages } from "@/i18n/messages";
import { getLocalizedPathAlternates, localizedPath } from "@/i18n/routing";
import { getLocaleFromParams, type LocaleParams } from "@/i18n/server";

type PricingRouteProps = {
  params: LocaleParams;
};

export async function generateMetadata({ params }: PricingRouteProps): Promise<Metadata> {
  const locale = await getLocaleFromParams(params);
  const messages = getMessages(locale);
  const title = `${messages.pricing.eyebrow} — ${messages.common.appName}`;

  return {
    title,
    description: messages.pricing.description,
    alternates: {
      canonical: localizedPath("/pricing", locale),
      languages: getLocalizedPathAlternates("/pricing")
    },
    openGraph: {
      title,
      description: messages.pricing.description,
      url: localizedPath("/pricing", locale)
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: messages.pricing.description
    }
  };
}

export default async function LocalizedPricingRoute({ params }: PricingRouteProps) {
  const locale = await getLocaleFromParams(params);
  const user = await getUser();

  return <PricingPage locale={locale} returnHref={getPricingReturnHref(Boolean(user))} />;
}
