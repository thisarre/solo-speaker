import Link from "next/link";
import { ArrowRight, Gauge, Mic2, PanelsTopLeft, Play, Sparkles, Timer, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { ProductPreview } from "@/modules/landing/components/product-preview";

const benefits = [
  {
    title: "Structurez votre message",
    text: "Transformez une idée brute en plan clair, sections ordonnées et progression facile à suivre.",
    icon: PanelsTopLeft
  },
  {
    title: "Améliorez votre contenu avec l'IA",
    text: "Développez, oralisez ou raccourcissez une section sans remplacer votre voix.",
    icon: Wand2
  },
  {
    title: "Présentez avec Speaking Mode",
    text: "Passez du brouillon au mode présentation avec timer, progression et lecture fluide.",
    icon: Mic2
  }
];

const workflow = [
  ["Préparer", "Créer le talk, poser l'audience, clarifier l'objectif."],
  ["Améliorer", "Utiliser l'IA pour rendre le texte plus net et plus oral."],
  ["Présenter", "Ouvrir Speaking Mode et garder le fil pendant la prise de parole."]
];

const useCases = ["Sermon", "Conférence", "Formation", "Pitch", "Discours"];

const speakingFeatures = [
  ["Auto-scroll", "Le texte avance avec le rythme prévu."],
  ["Timer", "Une lecture claire du temps écoulé et restant."],
  ["Progression", "Section courante et avancée globale visibles."],
  ["Plein écran", "Une surface calme pour présenter sans distraction."],
  ["Raccourcis", "Contrôle rapide au clavier pendant la session."]
];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-line bg-[color-mix(in_oklab,var(--bg)_92%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5 md:px-8">
          <Link aria-label="Solo Speaker" href="/">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-6 text-[13px] font-[550] text-muted md:flex">
            <a className="transition hover:text-foreground" href="#features">Fonctionnalités</a>
            <a className="transition hover:text-foreground" href="#use-cases">Cas d&apos;usage</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link className="hidden sm:block" href="/login">
              <Button size="sm" variant="quiet">Connexion</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" variant="primary">Commencer</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-line">
        <div className="mx-auto grid min-h-[calc(100vh-56px)] w-full max-w-6xl content-center gap-8 px-5 py-10 md:px-8 lg:grid-cols-[minmax(0,1fr)_520px] lg:py-14">
          <div className="flex max-w-2xl flex-col justify-center">
            <Badge className="w-fit" tone="accent">AI Speaking Studio</Badge>
            <h1 className="mt-5 max-w-3xl text-[44px] font-semibold leading-[.98] tracking-[0] text-foreground md:text-[64px] lg:text-[72px]">
              Préparez vos prises de parole avec l&apos;IA.
            </h1>
            <p className="mt-5 max-w-xl text-[16px] leading-7 text-muted">
              Créez, structurez, améliorez et présentez vos talks depuis un studio sobre pensé pour les speakers.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/signup">
                <Button leftIcon={<ArrowRight />} variant="primary">Commencer</Button>
              </Link>
              <Link href="/dashboard">
                <Button leftIcon={<PanelsTopLeft />} variant="ghost">Voir le dashboard</Button>
              </Link>
            </div>
            <div className="mt-8 grid max-w-lg grid-cols-3 gap-3 border-t border-line pt-4">
              {["Plan", "IA", "Live"].map((item) => (
                <div key={item}>
                  <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">{item}</p>
                  <p className="m-0 mt-1 text-[12.5px] leading-5 text-muted">
                    {item === "Plan" ? "Sections nettes" : item === "IA" ? "Texte oral" : "Mode scène"}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section className="border-b border-line py-14 md:py-16" id="features">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">Fonctionnalités</p>
              <h2 className="m-0 mt-2 text-[28px] font-semibold tracking-[0] text-foreground md:text-[34px]">Un studio pour aller de l&apos;idée à la scène.</h2>
            </div>
            <p className="m-0 max-w-sm text-[13.5px] leading-6 text-muted">
              Solo Speaker garde les contrôles essentiels proches du texte, sans transformer la préparation en usine.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <Card className="p-4" key={benefit.title}>
                  <div className="mb-4 flex size-9 items-center justify-center rounded-[9px] bg-accent-muted text-accent-ink">
                    <Icon className="size-4" />
                  </div>
                  <h3 className="m-0 text-[16px] font-semibold tracking-[0] text-foreground">{benefit.title}</h3>
                  <p className="m-0 mt-2 text-[13px] leading-6 text-muted">{benefit.text}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-panel py-14 md:py-16">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 md:px-8 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div>
            <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">Workflow</p>
            <h2 className="m-0 mt-2 text-[28px] font-semibold tracking-[0] text-foreground">Trois gestes. Un talk plus clair.</h2>
          </div>
          <div className="grid gap-2">
            {workflow.map(([title, text], index) => (
              <div className="grid gap-3 rounded-[12px] border border-border bg-surface p-4 md:grid-cols-[72px_1fr]" key={title}>
                <span className="font-mono text-[11px] uppercase tracking-[.12em] text-faint">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="m-0 text-[16px] font-semibold text-foreground">{title}</h3>
                  <p className="m-0 mt-1 text-[13px] leading-6 text-muted">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line py-14 md:py-16" id="use-cases">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <div className="mb-6 max-w-2xl">
            <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">Cas d&apos;usage</p>
            <h2 className="m-0 mt-2 text-[28px] font-semibold tracking-[0] text-foreground">Pour toutes les prises de parole structurées.</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {useCases.map((item) => (
              <Card className="p-3" key={item}>
                <p className="m-0 text-[14px] font-semibold text-foreground">{item}</p>
                <p className="m-0 mt-1 text-[12.5px] leading-5 text-muted">Plan, sections, répétition.</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-panel py-14 md:py-16">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 md:px-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div>
            <Badge tone="neutral">Speaking Mode</Badge>
            <h2 className="m-0 mt-4 text-[30px] font-semibold leading-tight tracking-[0] text-foreground md:text-[42px]">
              Une interface calme quand vient le moment de parler.
            </h2>
            <p className="m-0 mt-4 max-w-xl text-[14px] leading-7 text-muted">
              Le mode présentation retire les distractions et garde sous les yeux le texte, le temps, la progression et les repères utiles.
            </p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {speakingFeatures.map(([title, text]) => (
                <div className="rounded-[10px] border border-border bg-surface p-3" key={title}>
                  <p className="m-0 text-[13.5px] font-semibold text-foreground">{title}</p>
                  <p className="m-0 mt-1 text-[12.5px] leading-5 text-muted">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[12px] border border-border bg-[color-mix(in_oklab,var(--ink)_92%,var(--bg))] p-4 text-background shadow-[0_1px_2px_rgba(20,20,25,.04)]">
            <div className="mb-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-[.12em] text-[color-mix(in_oklab,var(--bg)_62%,transparent)]">
              <span>Live</span>
              <span>Section 3 · 5</span>
            </div>
            <p className="m-0 text-[25px] font-semibold leading-tight tracking-[0]">Gardez une phrase simple, puis laissez respirer.</p>
            <p className="m-0 mt-5 text-[14px] leading-7 text-[color-mix(in_oklab,var(--bg)_78%,transparent)]">
              Le timer avance, le script reste lisible, et chaque transition garde sa place pendant la présentation.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-2 border-t border-[color-mix(in_oklab,var(--bg)_18%,transparent)] pt-4">
              <div>
                <Timer className="mb-2 size-4 text-[color-mix(in_oklab,var(--bg)_72%,transparent)]" />
                <p className="m-0 font-mono text-[11px]">08:42</p>
              </div>
              <div>
                <Gauge className="mb-2 size-4 text-[color-mix(in_oklab,var(--bg)_72%,transparent)]" />
                <p className="m-0 font-mono text-[11px]">68%</p>
              </div>
              <div>
                <Play className="mb-2 size-4 text-[color-mix(in_oklab,var(--bg)_72%,transparent)]" />
                <p className="m-0 font-mono text-[11px]">Space</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-5 px-5 md:flex-row md:items-center md:px-8">
          <div>
            <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">Solo Speaker</p>
            <h2 className="m-0 mt-2 text-[30px] font-semibold tracking-[0] text-foreground">Votre prochain talk commence ici.</h2>
          </div>
          <Link href="/signup">
            <Button leftIcon={<Sparkles />} variant="primary">Créer un compte</Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
