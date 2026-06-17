import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { NewTalkForm } from "@/components/talks/NewTalkForm";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type NewTalkPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewTalkPage({ searchParams }: NewTalkPageProps) {
  const params = await searchParams;

  return (
    <AppShell>
      <div className="studio-scroll h-screen overflow-y-auto bg-background px-5 py-7 md:px-10 md:py-8">
        <div className="mx-auto w-full max-w-[940px]">
          <PageHeader
            eyebrow="Create"
            title="Créer un talk"
            description="Crée un brouillon avec une première section éditable."
            actions={
              <Link href="/talks">
                <Button leftIcon={<ArrowLeft />} variant="ghost">Back</Button>
              </Link>
            }
          />
          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,620px)_250px]">
            <Card className="p-5">
              <NewTalkForm error={params.error} />
            </Card>
            <aside className="rounded-[10px] border border-border bg-panel p-4">
              <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-foreground">
                <FileText className="size-4 text-accent-ink" />
                Structure
              </div>
              <div className="rounded-[8px] border border-border bg-surface p-3 text-xs leading-5 text-muted">
                Le brief devient une première section. Tu pourras ensuite ajouter, supprimer, réordonner et sauvegarder les sections dans l&apos;éditeur.
              </div>
            </aside>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
