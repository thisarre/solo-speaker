import Link from "next/link";
import { ArrowRight, Mic2, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { TalkCard } from "@/components/talks/TalkCard";
import { getTalks } from "@/modules/talks/queries";
import { talkTypeLabels } from "@/types/talk";

export default async function DashboardPage() {
  const talks = await getTalks();
  const currentTalk = talks[0];

  return (
    <AppShell>
      <div className="studio-scroll h-screen overflow-y-auto px-6 py-8 md:px-11">
        <PageHeader
          title="Studio"
          description="Vue calme de tes talks en cours, prête pour l'édition et la répétition."
          actions={
            <Link href="/talks/new">
              <Button leftIcon={<Plus />} variant="primary">New talk</Button>
            </Link>
          }
        />
        {currentTalk ? (
          <Card className="mt-7 flex flex-wrap items-center gap-6 rounded-[14px] p-6 md:p-[26px]">
            <div className="min-w-60 flex-1">
              <span className="rounded-md bg-accent-bg px-2 py-1 font-mono text-[10px] uppercase tracking-[.09em] text-accent-ink">
                Resume {talkTypeLabels[currentTalk.type]}
              </span>
              <h2 className="mb-1.5 mt-2.5 text-[19px] font-semibold tracking-[0]">{currentTalk.title}</h2>
              <div className="flex flex-wrap gap-3.5 font-mono text-[11px] text-faint">
                <span>{currentTalk.durationMinutes} min</span>
                <span>{currentTalk.audience || "Audience à préciser"}</span>
                <span>{currentTalk.updatedAtLabel}</span>
              </div>
            </div>
            <div className="w-full min-w-[150px] md:w-[190px]">
              <div className="mb-2 flex justify-between gap-2 font-mono text-[10.5px] text-faint">
                <span>Sections</span>
                <span>{currentTalk.sections.length}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-line2">
                <div className="h-full w-[65%] rounded-full bg-accent" />
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/talks/${currentTalk.id}`}>
                <Button variant="primary">Éditer</Button>
              </Link>
              <Link href={`/talks/${currentTalk.id}/speak`}>
                <Button leftIcon={<Mic2 />} variant="ghost">Speak</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="mt-7">
            <EmptyState
              action={
                <Link href="/talks/new">
                  <Button leftIcon={<Plus />} variant="primary">Créer un talk</Button>
                </Link>
              }
              icon={<Plus />}
              title="Aucun talk pour le moment"
              description="Crée ton premier talk pour valider le flux Supabase de bout en bout."
            />
          </div>
        )}
        <section className="mt-8">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="m-0 text-sm font-semibold tracking-[0]">Recent talks</h2>
            <Link className="flex items-center gap-1 text-[12.5px] text-mute hover:text-ink" href="/talks">
              Voir tout <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
            {talks.length ? (
              talks.slice(0, 3).map((talk) => (
                <TalkCard key={talk.id} talk={talk} />
              ))
            ) : (
              <div className="md:col-span-2 xl:col-span-3">
                <EmptyState
                  action={
                    <Link href="/talks/new">
                      <Button leftIcon={<Plus />} variant="primary">Créer un talk</Button>
                    </Link>
                  }
                  icon={<Plus />}
                  title="Aucun talk récent"
                  description="Tes derniers brouillons et talks prêts apparaîtront ici."
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
