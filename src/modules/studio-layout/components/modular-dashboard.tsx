"use client";

import Link from "next/link";
import { Archive, ArrowRight, Clock3, FileText, Gauge, LifeBuoy, Mic2, Plus, Settings2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClassName } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { RestartGuidedOnboardingButton } from "@/modules/onboarding/components/restart-guided-onboarding-button";
import { buildOnboardingDashboardRecommendations, getGuidedTalkSuggestion, type OnboardingProfile } from "@/modules/onboarding/personalization";
import { talkTypeLabels, type Talk } from "@/types/talk";
import { buildDashboardFocusPlan } from "../dashboard-focus-plan";
import { DashboardMetric, buildDashboardWidgetData, renderDashboardWidget } from "../dashboard-widget-registry";
import { useDashboardLayout } from "../layout-storage";
import { CustomizeDashboardDialog } from "./customize-dashboard-dialog";
import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { localizedPath } from "@/i18n/routing";

export function ModularDashboard({ profile, talks }: { profile?: OnboardingProfile | null; talks: Talk[] }) {
  const { locale, messages } = useI18n();
  const dashboard = messages.dashboard;
  const [customizing, setCustomizing] = useState(false);
  const { layout, reset, updateWidgets } = useDashboardLayout();
  const data = buildDashboardWidgetData(talks);
  const focusPlan = buildDashboardFocusPlan(talks, locale);
  const visibleWidgets = [...layout.widgets].sort((a, b) => a.order - b.order).filter((widget) => widget.visible);
  const currentTalk = data.currentTalk;
  const guidedTalk = getGuidedTalkSuggestion(profile, locale);
  const onboardingRecommendations = buildOnboardingDashboardRecommendations(profile, talks, locale);
  const supportRecommendation = onboardingRecommendations.find((recommendation) => recommendation.id === "onboarding-help");
  const profileRecommendations = onboardingRecommendations.filter((recommendation) => recommendation.id !== "onboarding-help");

  return (
    <div className="studio-scroll h-[100svh] overflow-y-auto px-6 py-8 md:px-11">
      <section className="rounded-[8px] border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(20,20,25,.04)] md:p-6" data-tour="dashboard-home">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge tone="accent">{dashboard.studio}</Badge>
            <h1 className="m-0 mt-3 text-[30px] font-semibold leading-tight tracking-[0] md:text-[38px]">
              {currentTalk ? dashboard.resumeTitle : dashboard.firstTitle.replace("{type}", talkTypeLabels[guidedTalk.type])}
            </h1>
            <p className="m-0 mt-3 max-w-xl text-[14px] leading-6 text-muted">
              {currentTalk
                ? dashboard.resumeBody
                : guidedTalk.message}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button leftIcon={<Settings2 />} onClick={() => setCustomizing(true)} variant="ghost">{dashboard.customize}</Button>
            <Link className={buttonClassName({ variant: "primary" })} href={localizedPath("/talks/new?guided=1", locale)} data-tour="create-talk">
              <span className="flex [&_svg]:size-4"><Plus /></span>
              {dashboard.createTalk}
            </Link>
          </div>
        </div>

        {currentTalk ? (
          <div className="mt-6 grid gap-3 border-t border-line pt-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">{dashboard.resumeEyebrow}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <h2 className="m-0 truncate text-[18px] font-semibold tracking-[0]">{currentTalk.title}</h2>
                <span className="font-mono text-[11px] text-faint">{currentTalk.durationMinutes} min</span>
                <span className="font-mono text-[11px] text-faint">{currentTalk.sections.length} sections</span>
                <span className="font-mono text-[11px] text-faint">{currentTalk.updatedAtLabel}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className={buttonClassName({ variant: "primary" })} href={localizedPath(`/talks/${currentTalk.id}`, locale)}>
                <span className="flex [&_svg]:size-4"><ArrowRight /></span>
                {dashboard.continuePreparation}
              </Link>
              <Link className={buttonClassName({ variant: "ghost" })} href={localizedPath(`/talks/${currentTalk.id}/speak`, locale)}>
                <span className="flex [&_svg]:size-4"><Mic2 /></span>
                {dashboard.rehearse}
              </Link>
            </div>
          </div>
        ) : null}

        <div className="mt-6 border-t border-line pt-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)] lg:items-center">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-accent-bg text-accent-ink">
                <Gauge className="size-5" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">{focusPlan.label}</p>
                  <span className="rounded-[7px] border border-line bg-panel px-2 py-0.5 text-[11px] font-[550] text-mute">{focusPlan.status}</span>
                </div>
                <h2 className="m-0 mt-1 text-[17px] font-semibold leading-snug tracking-[0]">{focusPlan.title}</h2>
                <p className="m-0 mt-1 max-w-2xl text-[13px] leading-5 text-muted">{focusPlan.description}</p>
              </div>
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="font-mono text-[10.5px] uppercase tracking-[.1em] text-faint">{dashboard.preparationSignal}</span>
                <span className="font-mono text-[11px] text-faint">{focusPlan.progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-line2">
                <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),color-mix(in_oklab,var(--ok)_65%,var(--accent)))]" style={{ width: `${focusPlan.progress}%` }} />
              </div>
              <Link className={buttonClassName({ className: "mt-3", variant: focusPlan.progress >= 80 ? "ghost" : "primary" })} href={focusPlan.href}>
                <span className="flex [&_svg]:size-4"><ArrowRight /></span>
                {dashboard.nextAction}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {supportRecommendation ? (
        <section className="mt-5 rounded-[12px] border border-[color-mix(in_oklab,var(--accent)_28%,var(--line))] bg-[color-mix(in_oklab,var(--accent)_7%,var(--surface))] p-4 shadow-[0_10px_34px_rgba(20,20,25,.06)] md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-accent-muted text-accent-ink">
                <LifeBuoy className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="m-0 font-mono text-[10.5px] uppercase tracking-[.12em] text-faint">{dashboard.support}</p>
                <h2 className="m-0 mt-1 text-[18px] font-semibold tracking-[0] text-foreground">{supportRecommendation.title}</h2>
                <p className="m-0 mt-1 max-w-2xl text-[13px] leading-6 text-muted">{supportRecommendation.message}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-[7px] border border-border bg-surface px-2 py-1 text-[11.5px] font-[550] text-muted">{dashboard.settingsTag}</span>
                  <span className="rounded-[7px] border border-border bg-surface px-2 py-1 text-[11.5px] font-[550] text-muted">{dashboard.aiModulesTag}</span>
                  <span className="rounded-[7px] border border-border bg-surface px-2 py-1 text-[11.5px] font-[550] text-muted">{dashboard.firstTalkTag}</span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <RestartGuidedOnboardingButton inline />
              {supportRecommendation.href ? (
                <a className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-[8px] bg-accent px-3 py-2 text-[12.5px] font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(20,20,25,.12)]" href={supportRecommendation.href}>
                  {supportRecommendation.actionLabel ?? dashboard.contactHelp}
                  <ArrowRight className="size-3.5" />
                </a>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {profileRecommendations.length ? (
        <section className="mt-5 grid gap-3 lg:grid-cols-3">
          {profileRecommendations.map((recommendation) => {
            const content = (
              <div
                className={`group h-full rounded-[10px] border p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(20,20,25,.08)] ${
                  recommendation.tone === "help"
                    ? "border-[color-mix(in_oklab,var(--accent)_24%,var(--line))] bg-[color-mix(in_oklab,var(--accent)_5%,var(--surface))]"
                    : "border-line bg-surface"
                }`}
              >
                <div className="mb-3 flex items-start gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-accent-muted text-accent-ink">
                    {recommendation.tone === "help" ? <LifeBuoy className="size-4" /> : <Sparkles className="size-4" />}
                  </span>
                  <div className="min-w-0">
                    <h2 className="m-0 text-[14px] font-semibold tracking-[0] text-foreground">{recommendation.title}</h2>
                    <p className="m-0 mt-1 text-[12.5px] leading-5 text-muted">{recommendation.message}</p>
                  </div>
                </div>
                {recommendation.actionLabel ? (
                  <span className="inline-flex items-center gap-1 text-[12.5px] font-[550] text-accent-ink transition group-hover:gap-1.5">
                    {recommendation.actionLabel}
                    <ArrowRight className="size-3.5" />
                  </span>
                ) : null}
              </div>
            );

            return recommendation.href?.startsWith("mailto:") ? (
              <a className="cursor-pointer" href={recommendation.href} key={recommendation.id}>
                {content}
              </a>
            ) : recommendation.href ? (
              <Link className="cursor-pointer" href={recommendation.href} key={recommendation.id}>
                {content}
              </Link>
            ) : (
              <div key={recommendation.id}>{content}</div>
            );
          })}
        </section>
      ) : null}

      <section className="mt-7 grid gap-3.5 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetric icon={<FileText />} label={dashboard.activeTalks} value={data.activeTalks.length} detail={dashboard.inStudio.replace("{count}", String(talks.length))} />
        <DashboardMetric icon={<Sparkles />} label={dashboard.readyToPresent} value={data.readyTalks.length} detail={dashboard.toFinish.replace("{count}", String(data.draftTalks.length))} />
        <DashboardMetric icon={<Clock3 />} label={dashboard.estimatedTime} value={`${data.totalMinutes} min`} detail={dashboard.preparedSections.replace("{count}", String(data.totalSections))} />
        <DashboardMetric icon={<Archive />} label={dashboard.archived} value={data.archivedTalks.length} detail={dashboard.outsideCurrentWork} />
      </section>

      {visibleWidgets.length ? (
        <section className="mt-7 grid gap-5 xl:grid-cols-2">
          {visibleWidgets.map((widget) => (
            <div className={widget.size === "large" ? "xl:col-span-2" : ""} key={widget.id}>
              {renderDashboardWidget(widget.id, data)}
            </div>
          ))}
        </section>
      ) : (
        <div className="mt-8">
          <EmptyState
            action={<Button leftIcon={<Settings2 />} onClick={reset} type="button" variant="primary">{dashboard.reset}</Button>}
            icon={<Settings2 />}
            title={dashboard.emptyHome}
            description={dashboard.emptyHomeBody}
          />
        </div>
      )}

      {customizing ? (
        <CustomizeDashboardDialog
          onClose={() => setCustomizing(false)}
          onReset={reset}
          onUpdate={updateWidgets}
          widgets={layout.widgets}
        />
      ) : null}
    </div>
  );
}
