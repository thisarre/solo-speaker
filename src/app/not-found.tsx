import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10 text-foreground">
      <Card className="w-full max-w-[460px] p-5 text-center">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">404</p>
        <h1 className="m-0 mt-2 text-[24px] font-semibold tracking-[0]">Page introuvable</h1>
        <p className="mx-auto mb-0 mt-2 max-w-sm text-[13.5px] leading-6 text-muted">
          Cette page n&apos;existe pas ou n&apos;est plus disponible dans ce studio.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/">
            <Button leftIcon={<Home />} variant="ghost">Accueil</Button>
          </Link>
          <Link href="/dashboard">
            <Button leftIcon={<ArrowLeft />} variant="primary">Dashboard</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
