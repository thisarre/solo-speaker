import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { TalkCard } from "@/components/talks/TalkCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getTalks } from "@/modules/talks/queries";

const filters = ["All", "Sermon", "Conférence", "Training", "Pitch", "Speech"];

export default async function TalksPage() {
  const talks = await getTalks();

  return (
    <AppShell>
      <div className="studio-scroll h-screen overflow-y-auto px-6 py-8 md:px-11">
        <PageHeader
          title="Talks"
          description="Tous tes objets Talk, isolés par utilisateur via Supabase RLS."
          actions={
            <Link href="/talks/new">
              <Button leftIcon={<Plus />} variant="primary">New talk</Button>
            </Link>
          }
        />
        <div className="mt-7 flex flex-wrap gap-2">
          {filters.map((filter, index) => (
            <span
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                index === 0 ? "border-line bg-surface text-ink shadow-[0_1px_2px_rgba(20,20,25,.05)]" : "border-transparent text-mute"
              }`}
              key={filter}
            >
              {filter}
            </span>
          ))}
        </div>
        {talks.length ? (
          <div className="mt-5 grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
            {talks.map((talk) => (
              <TalkCard key={talk.id} talk={talk} />
            ))}
            <Link
              className="flex min-h-[164px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line text-[13px] font-medium text-mute transition hover:border-faint hover:bg-surface hover:text-ink"
              href="/talks/new"
            >
              <Plus className="size-5 opacity-70" />
              Nouveau talk
            </Link>
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState
              action={
                <Link href="/talks/new">
                  <Button variant="primary">Créer un talk</Button>
                </Link>
              }
              icon={<Plus />}
              title="Aucun talk"
              description="Commence avec un sermon, une conférence, une formation, un pitch ou un speech."
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}
