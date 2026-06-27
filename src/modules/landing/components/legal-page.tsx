import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { getMessages } from "@/i18n/messages";
import { localizedPath, type Locale } from "@/i18n/routing";
import { LandingFooter } from "./landing-footer";

export function LegalPage({ children, locale, title, updatedLabel }: { children: ReactNode; locale: Locale; title: string; updatedLabel: string }) {
  const messages = getMessages(locale);
  const home = localizedPath("/", locale);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-[1480px] items-center justify-between px-5 md:px-8">
          <Link aria-label={messages.common.appName} href={home}>
            <Logo />
          </Link>
          <Link className="inline-flex items-center gap-1.5 text-[13px] font-[550] text-muted transition hover:text-foreground" href={home}>
            <ArrowLeft className="size-4" />
            {messages.common.appName}
          </Link>
        </div>
      </header>

      <article className="mx-auto w-full max-w-[820px] px-5 py-12 md:px-8 md:py-16">
        <h1 className="m-0 text-[30px] font-bold leading-tight tracking-[0] md:text-[40px]">{title}</h1>
        <p className="m-0 mt-3 text-[13px] text-faint">{updatedLabel}</p>
        <div className="legal-prose mt-9">{children}</div>
      </article>

      <LandingFooter locale={locale} />
    </main>
  );
}
