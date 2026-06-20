import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, GraduationCap, Handshake, HelpCircle, Mic2, Sparkles, Users } from "lucide-react";
import { completeOnboarding } from "@/modules/auth/actions";
import { getProfile, requireUser } from "@/modules/auth/queries";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { talkTypeLabels, type TalkType } from "@/types/talk";

type OnboardingPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

const speakerRoles = [
  { value: "pastor", label: "Pasteur", description: "Messages, enseignements, sermons.", icon: BookOpen },
  { value: "conference_speaker", label: "Conférencier", description: "Talks, keynotes, interventions.", icon: Mic2 },
  { value: "trainer", label: "Formateur", description: "Sessions pédagogiques et ateliers.", icon: GraduationCap },
  { value: "founder", label: "Fondateur", description: "Pitchs, visions, annonces.", icon: Sparkles },
  { value: "speaker", label: "Speaker", description: "Plusieurs formats selon le moment.", icon: Users }
];

const talkTypes: Array<{ value: TalkType; detail: string }> = [
  { value: "sermon", detail: "Avec suggestions bibliques par défaut." },
  { value: "conference", detail: "Idéal pour une intervention structurée." },
  { value: "training", detail: "Pour guider un groupe étape par étape." },
  { value: "pitch", detail: "Court, clair, orienté impact." },
  { value: "speech", detail: "Discours, cérémonie ou prise de parole." }
];

function safeNext(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  await requireUser();
  const [params, profile] = await Promise.all([searchParams, getProfile()]);
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
            Aide
          </a>
        </header>

        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <p className="mb-3 font-mono text-[10.5px] uppercase tracking-[.14em] text-faint">Première installation</p>
            <h1 className="m-0 max-w-xl text-[38px] font-semibold leading-[1.04] tracking-[0] md:text-[56px]">Réglons votre studio avant le premier talk.</h1>
            <p className="mt-5 max-w-lg text-[15px] leading-7 text-mute">
              Solo Speaker adapte l&apos;assistant, les modules et le prompteur à votre manière de prendre la parole. Vous pourrez tout modifier ensuite dans Réglages.
            </p>
            <div className="mt-6 rounded-[12px] border border-line bg-surface p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-accent-muted text-accent-ink">
                  <Handshake className="size-4" />
                </div>
                <div>
                  <p className="m-0 text-[14px] font-semibold">Besoin d&apos;aide pour démarrer ?</p>
                  <p className="m-0 mt-1 text-[13px] leading-6 text-mute">Cochez l&apos;accompagnement dans le formulaire et laissez une note. On garde ce signal sur votre profil.</p>
                </div>
              </div>
            </div>
          </div>

          <form action={completeOnboarding} className="rounded-[14px] border border-line bg-surface p-4 shadow-studio md:p-5">
            <input name="next" type="hidden" value={next} />
            {params.error ? <div className="mb-4 rounded-[10px] border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger">{params.error}</div> : null}

            <fieldset className="grid gap-3">
              <legend className="mb-2 text-[15px] font-semibold">Votre profil principal</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {speakerRoles.map((role, index) => {
                  const Icon = role.icon;
                  return (
                    <label className="group cursor-pointer rounded-[10px] border border-border bg-background p-3 transition has-[:checked]:border-accent has-[:checked]:bg-accent-muted" key={role.value}>
                      <input className="sr-only" defaultChecked={index === 0} name="speakerRole" type="radio" value={role.value} />
                      <span className="flex items-start gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-panel text-faint group-has-[:checked]:bg-surface group-has-[:checked]:text-accent-ink">
                          <Icon className="size-4" />
                        </span>
                        <span>
                          <span className="block text-[13.5px] font-semibold text-foreground">{role.label}</span>
                          <span className="mt-0.5 block text-[12px] leading-5 text-muted">{role.description}</span>
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="mt-5 grid gap-3">
              <legend className="mb-2 text-[15px] font-semibold">Le format que vous préparez le plus</legend>
              <div className="grid gap-2 sm:grid-cols-5">
                {talkTypes.map((type, index) => (
                  <label className="cursor-pointer rounded-[10px] border border-border bg-background p-3 transition has-[:checked]:border-accent has-[:checked]:bg-accent-muted" key={type.value}>
                    <input className="sr-only" defaultChecked={index === 1} name="primaryTalkType" type="radio" value={type.value} />
                    <span className="block text-[12.5px] font-semibold text-foreground">{talkTypeLabels[type.value]}</span>
                    <span className="mt-1 block text-[11.5px] leading-4 text-muted">{type.detail}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-5 rounded-[12px] border border-border bg-background p-3">
              <legend className="px-1 text-[15px] font-semibold">Accompagnement</legend>
              <label className="mt-2 flex items-start gap-3">
                <input className="mt-1 size-4 accent-[var(--accent)]" name="helpRequested" type="checkbox" value="yes" />
                <span>
                  <span className="block text-[13.5px] font-semibold text-foreground">Je veux pouvoir être aidé pour configurer mon studio</span>
                  <span className="mt-0.5 block text-[12.5px] leading-5 text-muted">On gardera cette préférence pour vous orienter vers le bon accompagnement.</span>
                </span>
              </label>
              <label className="mt-3 block">
                <span className="mb-1.5 block text-[12px] font-[550] text-muted">Note optionnelle</span>
                <textarea
                  className="studio-textarea min-h-20 w-full resize-y rounded-[9px] border border-border bg-surface px-3 py-2 text-[13px] text-foreground outline-none placeholder:text-faint focus:border-accent"
                  maxLength={600}
                  name="supportNote"
                  placeholder="Ex: je prépare surtout des sermons le dimanche, j'aimerais un prompteur très simple."
                />
              </label>
            </fieldset>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="m-0 max-w-sm text-[12px] leading-5 text-faint">Ces choix servent à personnaliser l&apos;expérience de départ. Ils restent modifiables.</p>
              <Button leftIcon={<ArrowRight />} type="submit" variant="primary">
                Entrer dans le studio
              </Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
