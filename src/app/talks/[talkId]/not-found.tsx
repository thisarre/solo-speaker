import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft, FileQuestion, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getMessages } from "@/i18n/messages";
import { defaultLocale, isLocale, localizedPath } from "@/i18n/routing";

export default async function TalkNotFoundPage() {
  const headerLocale = (await headers()).get("x-locale") ?? defaultLocale;
  const locale = isLocale(headerLocale) ? headerLocale : defaultLocale;
  const copy = getMessages(locale).talks;

  return (
    <AppShell>
      <main className="studio-scroll flex h-[100svh] items-center justify-center overflow-y-auto px-6 py-8 md:px-11">
        <div className="w-full max-w-xl">
          <EmptyState
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link href={localizedPath("/talks", locale)}>
                  <Button leftIcon={<ArrowLeft />} variant="ghost">{copy.backToTalks}</Button>
                </Link>
                <Link href={localizedPath("/talks/new", locale)}>
                  <Button leftIcon={<Plus />} variant="primary">{copy.newTalk}</Button>
                </Link>
              </div>
            }
            icon={<FileQuestion />}
            title={copy.notFoundTitle}
            description={copy.notFoundBody}
          />
        </div>
      </main>
    </AppShell>
  );
}
