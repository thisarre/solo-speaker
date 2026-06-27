import { OnboardingPageView } from "@/app/onboarding/page";
import { getLocaleFromParams, type LocaleParams } from "@/i18n/server";

type LocalizedOnboardingPageProps = {
  params: LocaleParams;
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LocalizedOnboardingPage({ params, searchParams }: LocalizedOnboardingPageProps) {
  const locale = await getLocaleFromParams(params);
  return <OnboardingPageView locale={locale} searchParams={searchParams} />;
}
