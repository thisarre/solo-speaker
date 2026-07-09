import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { PasswordFields } from "@/components/auth/PasswordFields";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { getMessages } from "@/i18n/messages";
import { localizedPath, type Locale } from "@/i18n/routing";
import { login, loginWithGoogle, signUp } from "../actions";

type AuthMessageParams = {
  error?: string;
  message?: string;
};

function getSafeNext(next: string | undefined, locale: Locale, fallbackPath: string) {
  if (next?.startsWith("/") && !next.startsWith("//")) return next;
  return localizedPath(fallbackPath, locale);
}

export function LoginFormPage({ locale, next, params }: { locale: Locale; next?: string; params: AuthMessageParams }) {
  const messages = getMessages(locale);
  const auth = messages.auth;
  const safeNext = getSafeNext(next, locale, "/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-ink">
      <div className="w-full max-w-[360px]">
        <div className="mb-7 flex justify-center">
          <Link aria-label={messages.common.appName} href={localizedPath("/", locale)}>
            <Logo label={messages.common.brandShort} />
          </Link>
        </div>
        <h1 className="m-0 text-center text-[21px] font-semibold tracking-[0]">{auth.loginTitle}</h1>
        <p className="mb-6 mt-1 text-center text-[13.5px] text-mute">{auth.loginSubtitle}</p>
        {params.error ? <Alert className="mb-4">{params.error}</Alert> : null}
        {params.message ? <p className="mb-4 rounded-[8px] border border-line bg-surface px-3 py-2 text-[12.5px] leading-5 text-mute">{params.message}</p> : null}
        <form action={loginWithGoogle} className="mb-4">
          <input name="next" type="hidden" value={safeNext} />
          <input name="source" type="hidden" value={localizedPath("/login", locale)} />
          <GoogleAuthButton label={auth.continueWithGoogle} pendingLabel={auth.redirecting} />
        </form>
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="font-mono text-[10px] uppercase tracking-[.12em] text-faint">{auth.or}</span>
          <span className="h-px flex-1 bg-line" />
        </div>
        <form action={login} className="grid gap-3.5">
          <input name="next" type="hidden" value={safeNext} />
          <Input id="email" label={auth.email} name="email" placeholder={auth.emailPlaceholder} required type="email" />
          <PasswordInput id="password" label={auth.password} minLength={8} name="password" placeholder="••••••••" required />
          <div className="-mt-1 flex justify-end">
            <Link className="text-[12px] font-medium text-mute hover:text-ink" href={localizedPath("/forgot-password", locale)}>
              {auth.forgotPassword}
            </Link>
          </div>
          <AuthSubmitButton idleLabel={auth.signIn} pendingLabel={auth.signingIn} />
        </form>
        <p className="mt-5 text-center text-[12.5px] text-faint">
          {auth.noAccount}{" "}
          <Link className="font-medium text-mute hover:text-ink" href={localizedPath("/signup", locale)}>
            {auth.createAccount}
          </Link>
        </p>
      </div>
      <p className="absolute bottom-7 font-mono text-[10.5px] uppercase tracking-[.1em] text-faint">{messages.common.brandShort}</p>
    </main>
  );
}

export function SignupFormPage({ checkout, email, locale, params, plan }: { checkout?: string; email?: string; locale: Locale; params: AuthMessageParams; plan?: string }) {
  const messages = getMessages(locale);
  const auth = messages.auth;
  const checkoutNext = checkout === "1" && plan ? `/api/billing/checkout?plan=${encodeURIComponent(plan)}&locale=${locale}` : localizedPath("/onboarding", locale);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-ink">
      <div className="w-full max-w-[360px]">
        <div className="mb-7 flex justify-center">
          <Link aria-label={messages.common.appName} href={localizedPath("/", locale)}>
            <Logo label={messages.common.brandShort} />
          </Link>
        </div>
        <h1 className="m-0 text-center text-[21px] font-semibold tracking-[0]">{auth.signupTitle}</h1>
        <p className="mb-6 mt-1 text-center text-[13.5px] text-mute">{auth.signupSubtitle}</p>
        {params.error ? <Alert className="mb-4">{params.error}</Alert> : null}
        {params.message ? <p className="mb-4 rounded-[8px] border border-line bg-surface px-3 py-2 text-[12.5px] leading-5 text-mute">{params.message}</p> : null}
        <form action={loginWithGoogle} className="mb-4">
          <input name="next" type="hidden" value={checkoutNext} />
          <input name="source" type="hidden" value={localizedPath("/signup", locale)} />
          <GoogleAuthButton label={auth.createWithGoogle} pendingLabel={auth.redirecting} />
        </form>
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="font-mono text-[10px] uppercase tracking-[.12em] text-faint">{auth.or}</span>
          <span className="h-px flex-1 bg-line" />
        </div>
        <form action={signUp} className="grid gap-3.5">
          <input name="checkout" type="hidden" value={checkout ?? ""} />
          <input name="locale" type="hidden" value={locale} />
          <input name="plan" type="hidden" value={plan ?? ""} />
          <Input id="name" label={auth.name} name="name" placeholder={auth.namePlaceholder} />
          <Input defaultValue={email ?? ""} id="email" label={auth.email} name="email" placeholder={auth.signupEmailPlaceholder} required type="email" />
          <PasswordFields locale={locale} submitIdleLabel={auth.createMyAccount} submitPendingLabel={auth.creating} withConfirm />
        </form>
        <p className="mt-5 text-center text-[12.5px] text-faint">
          {auth.alreadyRegistered}{" "}
          <Link className="font-medium text-mute hover:text-ink" href={localizedPath("/login", locale)}>
            {auth.loginLink}
          </Link>
        </p>
      </div>
    </main>
  );
}
