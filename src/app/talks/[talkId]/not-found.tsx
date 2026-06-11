import Link from "next/link";
import { ArrowLeft, FileQuestion, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function TalkNotFoundPage() {
  return (
    <AppShell>
      <main className="studio-scroll flex h-screen items-center justify-center overflow-y-auto px-6 py-8 md:px-11">
        <div className="w-full max-w-xl">
          <EmptyState
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/talks">
                  <Button leftIcon={<ArrowLeft />} variant="ghost">Retour aux talks</Button>
                </Link>
                <Link href="/talks/new">
                  <Button leftIcon={<Plus />} variant="primary">Nouveau talk</Button>
                </Link>
              </div>
            }
            icon={<FileQuestion />}
            title="Talk introuvable"
            description="Ce talk n'existe pas, a été supprimé, ou n'est pas accessible avec cette session."
          />
        </div>
      </main>
    </AppShell>
  );
}
