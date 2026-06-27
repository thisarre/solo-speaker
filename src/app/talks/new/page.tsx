import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileText, Mic2, PenLine, Presentation } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { NewTalkForm } from "@/components/talks/NewTalkForm";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getProfile } from "@/modules/auth/queries";
import { getGuidedTalkSuggestion } from "@/modules/onboarding/personalization";
import { getMessages } from "@/i18n/messages";
import { localizedPath, type Locale } from "@/i18n/routing";
import { resolveServerLocale } from "@/i18n/server";
import { headers } from "next/headers";

export type NewTalkSearchParams = { error?: string; guided?: string; welcome?: string };

type NewTalkPageProps = {
  searchParams: Promise<NewTalkSearchParams>;
};

type NewTalkPageViewProps = NewTalkPageProps & {
  locale?: Locale;
};

export default async function NewTalkPage({ searchParams }: NewTalkPageProps) {
  return <NewTalkPageView searchParams={searchParams} />;
}

export async function NewTalkPageView({ searchParams, locale: routeLocale }: NewTalkPageViewProps) {
  const [params, profile] = await Promise.all([searchParams, getProfile()]);
  const locale = resolveServerLocale((await headers()).get("x-locale"), routeLocale);
  const messages = getMessages(locale);
  const talks = messages.talks;
  const guide = getGuidedTalkSuggestion(profile, locale);
  const guided = params.guided === "1";
  const welcome = guided && params.welcome === "1";

  return (
    <AppShell locale={locale}>
      <div className="studio-scroll h-screen overflow-y-auto bg-background px-5 py-7 md:px-10 md:py-8">
        <div className="mx-auto w-full max-w-[1360px]">
          <PageHeader
            eyebrow={talks.createEyebrow}
            title={guided ? talks.createGuidedTitle : talks.createTitle}
            description={guided ? guide.message : talks.createDescription}
            actions={
              <Link href={localizedPath("/talks", locale)}>
                <Button leftIcon={<ArrowLeft />} variant="ghost">{talks.back}</Button>
              </Link>
            }
          />
          {welcome ? <FirstTalkWelcome roleLabel={guide.roleLabel} steps={talks.welcomeSteps} texts={talks} /> : null}
          <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="p-5" data-tour="create-talk">
              <NewTalkForm error={params.error} guide={guide} />
            </Card>
            <aside className="rounded-[10px] border border-border bg-panel p-4">
              <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-foreground">
                <FileText className="size-4 text-accent-ink" />
                {guided ? talks.starterGuide : talks.structure}
              </div>
              <div className="rounded-[8px] border border-border bg-surface p-3 text-xs leading-5 text-muted">
                {guided
                  ? guide.briefPlaceholder
                  : talks.structureHelp}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function FirstTalkWelcome({ roleLabel, steps, texts }: { roleLabel: string; steps: string[][]; texts: ReturnType<typeof getMessages>["talks"] }) {
  const icons = [<PenLine key="idea" />, <Mic2 key="voice" />, <Presentation key="rehearse" />];

  return (
    <section className="mt-6 rounded-[12px] border border-[color-mix(in_oklab,var(--accent)_24%,var(--line))] bg-[color-mix(in_oklab,var(--accent)_6%,var(--surface))] p-4 md:p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-2 rounded-[8px] bg-accent-muted px-2.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[.12em] text-accent-ink">
            <CheckCircle2 className="size-3.5" />
            {texts.firstConnection}
          </div>
          <h2 className="m-0 text-[21px] font-semibold tracking-[0] text-foreground">{texts.welcomeTitle}</h2>
          <p className="m-0 mt-2 max-w-2xl text-[13.5px] leading-6 text-muted">
            {texts.welcomeBody.replace("{role}", roleLabel)}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:w-[520px]">
          {steps.map(([label, text], index) => (
            <div className="rounded-[10px] border border-border bg-surface p-3" key={label}>
              <div className="mb-2 flex size-8 items-center justify-center rounded-[8px] bg-panel text-accent-ink [&_svg]:size-4">{icons[index]}</div>
              <p className="m-0 text-[12.5px] font-semibold text-foreground">{label}</p>
              <p className="m-0 mt-1 text-[11.5px] leading-5 text-muted">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
