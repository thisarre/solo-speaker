import { redirect } from "next/navigation";
import { SignupFormPage } from "@/modules/auth/components/auth-pages";
import { getProfile, getUser } from "@/modules/auth/queries";
import { getLocalizedPathAlternates, localizedPath } from "@/i18n/routing";
import { getLocaleFromParams, type LocaleParams } from "@/i18n/server";
import { getMessages } from "@/i18n/messages";

type SignupPageProps = {
  params: LocaleParams;
  searchParams: Promise<{ checkout?: string; email?: string; error?: string; message?: string; plan?: string }>;
};

export async function generateMetadata({ params }: Pick<SignupPageProps, "params">) {
  const locale = await getLocaleFromParams(params);
  const messages = getMessages(locale);
  const title = `${messages.auth.signupTitle} · ${messages.common.appName}`;

  return {
    title,
    description: messages.auth.signupSubtitle,
    alternates: {
      canonical: localizedPath("/signup", locale),
      languages: getLocalizedPathAlternates("/signup")
    }
  };
}

export default async function LocalizedSignupPage({ params, searchParams }: SignupPageProps) {
  const locale = await getLocaleFromParams(params);
  const query = await searchParams;
  const user = await getUser();

  if (user) {
    const profile = await getProfile();
    if (profile && !profile.onboarding_completed_at) {
      redirect(localizedPath("/onboarding", locale));
    }
    redirect(localizedPath("/dashboard", locale));
  }

  return <SignupFormPage checkout={query.checkout} email={query.email} locale={locale} params={query} plan={query.plan} />;
}
