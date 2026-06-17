import Link from "next/link";
import { ArrowRight, Check, FileText, Mic2, PanelsTopLeft, Sparkles, Timer, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LandingMotion } from "@/modules/landing/components/landing-motion";
import { ProductPreview } from "@/modules/landing/components/product-preview";

const features = [
  {
    title: "Structurer",
    text: "Clarifiez l'objectif, l'audience et les sections avant de développer.",
    icon: PanelsTopLeft
  },
  {
    title: "Oraliser",
    text: "Rendez une section plus naturelle, plus courte ou plus vivante sans changer votre voix.",
    icon: Wand2
  },
  {
    title: "Présenter",
    text: "Répétez avec un prompteur vocal, un timer et une position de lecture réglable.",
    icon: Mic2
  }
];

const formats = ["Sermon", "Conférence", "Formation", "Pitch", "Discours"];

const prompterDetails = [
  "Défilement progressif quand vous arrivez en fin de paragraphe",
  "Texte actif net, sans encadrer chaque mot",
  "Mode clair et sombre cohérent avec le reste de l'application",
  "Fallback manuel avec vitesse, taille et position de lecture"
];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <LandingMotion />

      <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5 md:px-8">
          <Link aria-label="Solo Speaker" href="/">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-6 text-[13px] font-[550] text-muted md:flex">
            <a className="transition hover:text-foreground" href="#studio">Studio</a>
            <a className="transition hover:text-foreground" href="#prompteur">Prompteur</a>
            <a className="transition hover:text-foreground" href="#formats">Formats</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle className="hidden w-[92px] sm:inline-grid" />
            <Link className="hidden sm:block" href="/login">
              <Button size="sm" variant="quiet">Connexion</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" variant="primary">Créer un talk</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-line">
        <div className="mx-auto grid min-h-[calc(100svh-56px)] w-full max-w-6xl items-center gap-10 px-5 py-10 md:px-8 lg:grid-cols-[minmax(0,.9fr)_minmax(460px,1fr)] lg:py-16">
          <div className="max-w-2xl">
            <Badge data-landing-reveal tone="accent">AI Speaking Studio</Badge>
            <h1 className="m-0 mt-5 text-[46px] font-bold leading-[.96] tracking-[0] md:text-[68px] lg:text-[76px]" data-landing-reveal>
              Préparez vos prises de parole. Gardez le fil en live.
            </h1>
            <p className="m-0 mt-5 max-w-xl text-[17px] leading-8 text-muted" data-landing-reveal>
              Structurez vos idées, rendez votre texte plus oral, puis répétez avec un prompteur vocal qui suit votre rythme.
            </p>
            <div className="mt-7 flex flex-wrap gap-3" data-landing-reveal>
              <Link href="/signup">
                <Button className="h-10 rounded-[8px] px-4" leftIcon={<ArrowRight />} variant="primary">Créer mon premier talk</Button>
              </Link>
              <Link href="/dashboard">
                <Button className="h-10 rounded-[8px] px-4" leftIcon={<PanelsTopLeft />} variant="ghost">Voir le studio</Button>
              </Link>
            </div>
            <div className="mt-8 grid max-w-lg grid-cols-3 gap-4 border-t border-line pt-5" data-landing-reveal>
              {[
                ["Plan", "Sections nettes"],
                ["IA", "Texte plus oral"],
                ["Live", "Prompteur vocal"]
              ].map(([title, text]) => (
                <div key={title}>
                  <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">{title}</p>
                  <p className="m-0 mt-1 text-[13px] leading-5 text-muted">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div data-landing-reveal>
            <ProductPreview />
          </div>
        </div>
      </section>

      <section className="border-b border-line py-14 md:py-18" id="studio">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <div className="mb-7 max-w-2xl" data-scroll-reveal>
            <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">Studio</p>
            <h2 className="m-0 mt-2 text-[30px] font-bold leading-tight tracking-[0] md:text-[42px]">
              Un flux court entre l&apos;idée et la prise de parole.
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article className="rounded-[8px] border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(20,20,25,.04)]" data-scroll-reveal key={feature.title}>
                  <div className="mb-5 flex size-9 items-center justify-center rounded-[7px] bg-foreground text-background">
                    <Icon className="size-4" />
                  </div>
                  <h3 className="m-0 text-[17px] font-semibold tracking-[0]">{feature.title}</h3>
                  <p className="m-0 mt-2 text-[13.5px] leading-6 text-muted">{feature.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-panel py-14 md:py-18" id="prompteur">
        <div className="mx-auto grid w-full max-w-6xl gap-9 px-5 md:px-8 lg:grid-cols-[minmax(0,1fr)_430px]">
          <div data-scroll-reveal>
            <Badge tone="neutral">Speaking Mode</Badge>
            <h2 className="m-0 mt-4 max-w-3xl text-[32px] font-bold leading-tight tracking-[0] md:text-[48px]">
              Le prompteur prépare la suite avant le bloc suivant.
            </h2>
            <p className="m-0 mt-4 max-w-2xl text-[15px] leading-7 text-muted">
              Le suivi vocal estime votre progression dans le paragraphe. Le texte actif reste lisible, la suite arrive doucement, et vous ne vous retrouvez pas bloqué sur la dernière ligne.
            </p>
          </div>

          <div className="rounded-[8px] border border-line bg-surface p-4" data-scroll-reveal>
            <div className="mb-6 flex items-center justify-between font-mono text-[10px] uppercase tracking-[.12em] text-faint">
              <span>Prompteur</span>
              <span>Voice follow</span>
            </div>
            <div className="relative rounded-[7px] bg-[#111217] p-5 text-[#ececf1]">
              <p className="m-0 text-[25px] font-bold leading-tight tracking-[0]">Laissez le regard tenir la salle.</p>
              <p className="m-0 mt-4 text-[18px] font-semibold leading-7 text-[#ececf1]/42">La transition arrive naturellement.</p>
              <div className="mt-6 h-px origin-left bg-[#ececf1]/64" data-progress-line />
              <div className="mt-5 grid grid-cols-2 gap-2">
                <div className="border border-[#ececf1]/12 p-3">
                  <Timer className="mb-2 size-4 text-[#ececf1]/60" />
                  <p className="m-0 font-mono text-[11px]">08:42</p>
                </div>
                <div className="border border-[#ececf1]/12 p-3">
                  <Mic2 className="mb-2 size-4 text-[#ececf1]/60" />
                  <p className="m-0 font-mono text-[11px]">Following</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line py-14 md:py-18" id="formats">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between" data-scroll-reveal>
            <div>
              <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">Formats</p>
              <h2 className="m-0 mt-2 max-w-2xl text-[30px] font-bold leading-tight md:text-[42px]">Pour toutes les prises de parole structurées.</h2>
            </div>
            <p className="m-0 max-w-sm text-[14px] leading-6 text-muted">
              Le même espace de travail pour préparer, améliorer et répéter sans changer d&apos;outil.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {formats.map((item) => (
              <div className="rounded-[8px] border border-line bg-surface p-3" data-scroll-reveal key={item}>
                <FileText className="mb-4 size-4 text-faint" />
                <p className="m-0 text-[15px] font-semibold">{item}</p>
                <p className="m-0 mt-1 text-[12.5px] leading-5 text-muted">Plan, voix, répétition.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-panel py-14 text-foreground md:py-18">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 md:px-8 lg:grid-cols-[minmax(0,1fr)_430px]">
          <div data-scroll-reveal>
            <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">Solo Speaker</p>
            <h2 className="m-0 mt-3 max-w-2xl text-[34px] font-bold leading-tight tracking-[0] md:text-[52px]">
              Votre prochaine prise de parole peut déjà respirer.
            </h2>
            <div className="mt-6">
              <Link href="/signup">
                <Button className="h-10 rounded-[8px] px-4" leftIcon={<Sparkles />} variant="primary">Créer mon premier talk</Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-2" data-scroll-reveal>
            {prompterDetails.map((item) => (
              <div className="flex items-start gap-3 rounded-[8px] border border-line bg-surface p-3" key={item}>
                <Check className="mt-0.5 size-4 shrink-0 text-accent-ink" />
                <p className="m-0 text-[14px] leading-6 text-muted">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
