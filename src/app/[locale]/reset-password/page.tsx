import Link from "next/link";
import { updatePassword } from "@/modules/auth/actions";
import { getUser } from "@/modules/auth/queries";
import { Alert } from "@/components/ui/Alert";
import { PasswordFields } from "@/components/auth/PasswordFields";
import { Logo } from "@/components/ui/Logo";
import { getMessages } from "@/i18n/messages";
import { getLocalizedPathAlternates, localizedPath } from "@/i18n/routing";
import { getLocaleFromParams, type LocaleParams } from "@/i18n/server";

type ResetPasswordPageProps = {
  params: LocaleParams;
  searchParams: Promise<{ error?: string }>;
};

export async function generateMetadata({ params }: Pick<ResetPasswordPageProps, "params">) {
  const locale = await getLocaleFromParams(params);
  const messages = getMessages(locale);

  return {
    title: `${messages.auth.resetTitle} · ${messages.common.appName}`,
    description: messages.auth.resetSubtitle,
    alternates: {
      canonical: localizedPath("/reset-password", locale),
      languages: getLocalizedPathAlternates("/reset-password")
    }
  };
}

export default async function LocalizedResetPasswordPage({ params, searchParams }: ResetPasswordPageProps) {
  const locale = await getLocaleFromParams(params);
  const [query, user] = await Promise.all([searchParams, getUser()]);
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
        <h1 className="m-0 text-center text-[21px] font-semibold tracking-[0]">{auth.resetTitle}</h1>
        <p className="mb-6 mt-1 text-center text-[13.5px] leading-6 text-mute">{auth.resetSubtitle}</p>
        {query.error ? <Alert className="mb-4">{query.error}</Alert> : null}
        {!user ? (
          <div className="rounded-[10px] border border-line bg-surface p-4 text-center">
            <p className="m-0 text-[13px] leading-6 text-mute">{auth.resetExpired}</p>
            <Link className="studio-button-primary mt-4 inline-flex rounded-[8px] px-3.5 py-2 text-[12.5px] font-[550] transition hover:opacity-90" href={localizedPath("/forgot-password", locale)}>
              {auth.requestNewLink}
            </Link>
          </div>
        ) : (
          <form action={updatePassword} className="grid gap-3.5">
            <PasswordFields locale={locale} passwordLabel={auth.newPassword} submitIdleLabel={auth.updatePassword} submitPendingLabel={auth.updatingPassword} withConfirm />
          </form>
        )}
      </div>
      <p className="absolute bottom-7 font-mono text-[10.5px] uppercase tracking-[.1em] text-faint">{messages.common.brandShort}</p>
    </main>
  );
}
