import Link from "next/link";
import { ArrowRight, FileText, Mic2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { getTalks } from "@/modules/talks/queries";

export default async function HomePage() {
  let previewTalk = null;

  try {
    const talks = await getTalks();
    previewTalk = talks[0] ?? null;
  } catch {
    previewTalk = null;
  }

  return (
    <main className="min-h-screen bg-bg text-ink">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-5">
        <nav className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="quiet">Login</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="primary">Open studio</Button>
            </Link>
          </div>
        </nav>
        <div className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1fr_460px]">
          <div>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[.14em] text-faint">Studio IA pour prise de parole</p>
            <h1 className="max-w-3xl text-[clamp(42px,7vw,76px)] font-semibold leading-[.96] tracking-[0]">
              Préparer, structurer, répéter et présenter un talk.
            </h1>
            <p className="mt-6 max-w-xl text-[16px] leading-7 text-mute">
              Solo Speaker pose une surface de travail claire pour transformer une idée en discours utilisable, sans bruit ni dashboard décoratif.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/talks/new">
                <Button leftIcon={<FileText />} variant="primary">Créer un talk</Button>
              </Link>
              <Link href={previewTalk ? `/talks/${previewTalk.id}/speak` : "/talks/new"}>
                <Button leftIcon={<Mic2 />} variant="ghost">Preview speaking</Button>
              </Link>
            </div>
          </div>
          <Link className="group block" href={previewTalk ? `/talks/${previewTalk.id}` : "/talks/new"}>
            <div className="rounded-[14px] border border-line bg-surface p-6 shadow-studio transition group-hover:-translate-y-1 group-hover:border-faint">
              <div className="mb-16 flex items-center justify-between">
                <span className="rounded-md bg-accent-bg px-2 py-1 font-mono text-[10px] uppercase tracking-[.09em] text-accent-ink">Conférence</span>
                <ArrowRight className="size-4 text-faint" />
              </div>
              <h2 className="text-2xl font-semibold leading-tight tracking-[0]">
                {previewTalk?.title ?? "Créer ton premier talk"}
              </h2>
              <p className="mt-3 text-[13px] leading-6 text-mute">
                {previewTalk ? "Accroche, tension, méthode et appel à l'action prêts pour répétition." : "Ajoute tes sections, puis lance le teleprompter."}
              </p>
              <div className="mt-8 h-1 rounded-full bg-line2">
                <div className="h-full w-[68%] rounded-full bg-accent" />
              </div>
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
