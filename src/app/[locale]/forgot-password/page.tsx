import Link from "next/link";
import { requestPasswordReset } from "@/modules/auth/actions";
import { Alert } from "@/components/ui/Alert";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { getMessages } from "@/i18n/messages";
import { getLocalizedPathAlternates, localizedPath } from "@/i18n/routing";
import { getLocaleFromParams, type LocaleParams } from "@/i18n/server";

type ForgotPasswordPageProps = {
  params: LocaleParams;
  searchParams: Promise<{ error?: string; message?: string }>;
};

export async function generateMetadata({ params }: Pick<ForgotPasswordPageProps, "params">) {
  const locale = await getLocaleFromParams(params);
  const messages = getMessages(locale);

  return {
    title: `${messages.auth.forgotTitle} · ${messages.common.appName}`,
    description: messages.auth.forgotSubtitle,
    alternates: {
      canonical: localizedPath("/forgot-password", locale),
      languages: getLocalizedPathAlternates("/forgot-password")
    }
  };
}

export default async function LocalizedForgotPasswordPage({ params, searchParams }: ForgotPasswordPageProps) {
  const locale = await getLocaleFromParams(params);
  const query = await searchParams;
  const messages = getMessages(locale);
  const auth = messages.auth;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-ink">
      <div className="w-full max-w-[380px]">
        <div className="mb-7 flex justify-center">
          <Link aria-label={messages.common.appName} href={localizedPath("/", locale)}>
            <Logo />
          </Link>
        </div>
        <h1 className="m-0 text-center text-[21px] font-semibold tracking-[0]">{auth.forgotTitle}</h1>
        <p className="mb-6 mt-1 text-center text-[13.5px] leading-6 text-mute">{auth.forgotSubtitle}</p>
        {query.error ? <Alert className="mb-4">{query.error}</Alert> : null}
        {query.message ? <p className="mb-4 rounded-[8px] border border-line bg-surface px-3 py-2 text-[12.5px] leading-5 text-mute">{query.message}</p> : null}
        <form action={requestPasswordReset} className="grid gap-3.5">
          <Input id="email" label={auth.email} name="email" placeholder="you@example.com" required type="email" />
          <AuthSubmitButton idleLabel={auth.sendResetLink} pendingLabel={auth.sendingResetLink} />
        </form>
        <p className="mt-5 text-center text-[12.5px] text-faint">
          {auth.rememberedPassword}{" "}
          <Link className="font-medium text-mute hover:text-ink" href={localizedPath("/login", locale)}>
            {auth.loginLink}
          </Link>
        </p>
      </div>
      <p className="absolute bottom-7 font-mono text-[10.5px] uppercase tracking-[.1em] text-faint">{messages.common.brandShort}</p>
    </main>
  );
}
