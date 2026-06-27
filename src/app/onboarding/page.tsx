import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ArrowRight, BookOpen, GraduationCap, Handshake, HelpCircle, Mic2, Sparkles, Users } from "lucide-react";
import { completeOnboarding } from "@/modules/auth/actions";
import { getProfile, requireUser } from "@/modules/auth/queries";
import { firstTalkOnboardingPath } from "@/modules/auth/security";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import type { TalkType } from "@/types/talk";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/i18n/routing";
import { resolveServerLocale } from "@/i18n/server";

type OnboardingPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

const roleIcons = {
  conference_speaker: Mic2,
  founder: Sparkles,
  pastor: BookOpen,
  speaker: Users,
  trainer: GraduationCap
} as const;

function safeNext(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : firstTalkOnboardingPath;
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  return <OnboardingPageView searchParams={searchParams} />;
}

export async function OnboardingPageView({ searchParams, locale: routeLocale }: OnboardingPageProps & { locale?: Locale }) {
  await requireUser();
  const [params, profile] = await Promise.all([searchParams, getProfile()]);
  const locale = resolveServerLocale((await headers()).get("x-locale"), routeLocale);
  const onboarding = getMessages(locale).onboarding;
  const next = safeNext(params.next);

  if (profile?.onboarding_completed_at) {
    redirect(next);
  }

  return (
    <main className="min-h-screen bg-bg px-5 py-6 text-ink md:px-8 md:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-[1120px] flex-col">
        <header className="flex items-center justify-between gap-4">
          <Logo />
          <a className="inline-flex items-center gap-2 rounded-[8px] border border-line bg-surface px-3 py-2 text-[12.5px] font-[550] text-mute transition hover:text-ink" href="mailto:support@solo-speaker.app?subject=Besoin%20d'aide%20Solo%20Speaker">
            <HelpCircle className="size-4" />
            {onboarding.help}
          </a>
        </header>

        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <p className="mb-3 font-mono text-[10.5px] uppercase tracking-[.14em] text-faint">{onboarding.eyebrow}</p>
            <h1 className="m-0 max-w-xl text-[38px] font-semibold leading-[1.04] tracking-[0] md:text-[56px]">{onboarding.title}</h1>
            <p className="mt-5 max-w-lg text-[15px] leading-7 text-mute">
              {onboarding.subtitle}
            </p>
            <div className="mt-6 rounded-[12px] border border-line bg-surface p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-accent-muted text-accent-ink">
                  <Handshake className="size-4" />
                </div>
                <div>
                  <p className="m-0 text-[14px] font-semibold">{onboarding.helpTitle}</p>
                  <p className="m-0 mt-1 text-[13px] leading-6 text-mute">{onboarding.helpBody}</p>
                </div>
              </div>
            </div>
          </div>

          <form action={completeOnboarding} className="rounded-[14px] border border-line bg-surface p-4 shadow-studio md:p-5">
            <input name="next" type="hidden" value={next} />
            <input name="locale" type="hidden" value={locale} />
            {params.error ? <div className="mb-4 rounded-[10px] border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger">{params.error}</div> : null}

            <fieldset className="grid gap-3">
              <legend className="mb-2 text-[15px] font-semibold">{onboarding.profileLegend}</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {onboarding.roles.map(([value, label, description], index) => {
                  const Icon = roleIcons[value as keyof typeof roleIcons] ?? Users;
                  return (
                    <label className="group cursor-pointer rounded-[10px] border border-border bg-background p-3 transition has-[:checked]:border-accent has-[:checked]:bg-accent-muted" key={value}>
                      <input className="sr-only" defaultChecked={index === 0} name="speakerRole" type="radio" value={value} />
                      <span className="flex items-start gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-panel text-faint group-has-[:checked]:bg-surface group-has-[:checked]:text-accent-ink">
                          <Icon className="size-4" />
                        </span>
                        <span>
                          <span className="block text-[13.5px] font-semibold text-foreground">{label}</span>
                          <span className="mt-0.5 block text-[12px] leading-5 text-muted">{description}</span>
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="mt-5 grid gap-3">
              <legend className="mb-2 text-[15px] font-semibold">{onboarding.formatLegend}</legend>
              <div className="grid gap-2 sm:grid-cols-5">
                {onboarding.talkTypes.map(([value, label, detail], index) => (
                  <label className="cursor-pointer rounded-[10px] border border-border bg-background p-3 transition has-[:checked]:border-accent has-[:checked]:bg-accent-muted" key={value}>
                    <input className="sr-only" defaultChecked={index === 1} name="primaryTalkType" type="radio" value={value as TalkType} />
                    <span className="block text-[12.5px] font-semibold text-foreground">{label}</span>
                    <span className="mt-1 block text-[11.5px] leading-4 text-muted">{detail}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-5 rounded-[12px] border border-border bg-background p-3">
              <legend className="px-1 text-[15px] font-semibold">{onboarding.supportLegend}</legend>
              <label className="mt-2 flex items-start gap-3">
                <input className="mt-1 size-4 accent-[var(--accent)]" name="helpRequested" type="checkbox" value="yes" />
                <span>
                  <span className="block text-[13.5px] font-semibold text-foreground">{onboarding.supportLabel}</span>
                  <span className="mt-0.5 block text-[12.5px] leading-5 text-muted">{onboarding.supportDescription}</span>
                </span>
              </label>
              <label className="mt-3 block">
                <span className="mb-1.5 block text-[12px] font-[550] text-muted">{onboarding.supportNote}</span>
                <textarea
                  className="studio-textarea min-h-20 w-full resize-y rounded-[9px] border border-border bg-surface px-3 py-2 text-[13px] text-foreground outline-none placeholder:text-faint focus:border-accent"
                  maxLength={600}
                  name="supportNote"
                  placeholder={onboarding.supportPlaceholder}
                />
              </label>
            </fieldset>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="m-0 max-w-sm text-[12px] leading-5 text-faint">{onboarding.footerNote}</p>
              <Button leftIcon={<ArrowRight />} type="submit" variant="primary">
                {onboarding.submit}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
