import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { getMessages } from "@/i18n/messages";
import { defaultLocale, isLocale, localizedPath } from "@/i18n/routing";

export default async function NotFound() {
  const headerLocale = (await headers()).get("x-locale") ?? defaultLocale;
  const locale = isLocale(headerLocale) ? headerLocale : defaultLocale;
  const messages = getMessages(locale);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10 text-foreground">
      <Card className="w-full max-w-[460px] p-5 text-center">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">404</p>
        <h1 className="m-0 mt-2 text-[24px] font-semibold tracking-[0]">{messages.errors.notFoundTitle}</h1>
        <p className="mx-auto mb-0 mt-2 max-w-sm text-[13.5px] leading-6 text-muted">
          {messages.errors.notFoundBody}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href={localizedPath("/", locale)}>
            <Button leftIcon={<Home />} variant="ghost">{messages.ui.home}</Button>
          </Link>
          <Link href={localizedPath("/dashboard", locale)}>
            <Button leftIcon={<ArrowLeft />} variant="primary">{messages.navigation.dashboard}</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
