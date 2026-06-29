import { redirect } from "next/navigation";
import { LoginFormPage } from "@/modules/auth/components/auth-pages";
import { getProfile, getUser } from "@/modules/auth/queries";
import { getLocalizedPathAlternates, localizedPath } from "@/i18n/routing";
import { getLocaleFromParams, type LocaleParams } from "@/i18n/server";
import { getMessages } from "@/i18n/messages";

type LoginPageProps = {
  params: LocaleParams;
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
};

export async function generateMetadata({ params }: Pick<LoginPageProps, "params">) {
  const locale = await getLocaleFromParams(params);
  const messages = getMessages(locale);
  const title = `${messages.auth.loginTitle} · ${messages.common.appName}`;

  return {
    title,
    description: messages.auth.loginSubtitle,
    alternates: {
      canonical: localizedPath("/login", locale),
      languages: getLocalizedPathAlternates("/login")
    }
  };
}

export default async function LocalizedLoginPage({ params, searchParams }: LoginPageProps) {
  const locale = await getLocaleFromParams(params);
  const query = await searchParams;
  const user = await getUser();
  const safeNext = query.next && query.next.startsWith("/") && !query.next.startsWith("//") ? query.next : localizedPath("/dashboard", locale);

  if (user) {
    const profile = await getProfile();
    if (profile && !profile.onboarding_completed_at) {
      redirect(`${localizedPath("/onboarding", locale)}?next=${encodeURIComponent(safeNext)}`);
    }
    redirect(safeNext);
  }

  return <LoginFormPage locale={locale} next={query.next} params={query} />;
}
