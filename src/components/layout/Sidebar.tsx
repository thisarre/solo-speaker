"use client";

import Link from "next/link";
import { CalendarClock, FileText, HelpCircle, Home, LogOut, MoreHorizontal, Plus, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { CommandPalette } from "./CommandPalette";
import { LogoutButton } from "./LogoutButton";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { RestartGuidedOnboardingButton } from "@/modules/onboarding/components/restart-guided-onboarding-button";
import type { TrialReminder } from "@/modules/billing/trial";
import { getMessages } from "@/i18n/messages";
import { getPathWithoutLocale, localizedPath, type Locale } from "@/i18n/routing";

function getNavItems(talkCount: number, locale: Locale) {
  const navigation = getMessages(locale).navigation;
  return [
    { href: localizedPath("/dashboard", locale), label: navigation.dashboard, icon: Home },
    { href: localizedPath("/talks", locale), label: navigation.talks, icon: FileText, count: talkCount },
    { href: localizedPath("/talks/new", locale), label: navigation.newTalk, icon: Plus },
    { href: localizedPath("/settings", locale), label: navigation.settings, icon: Settings }
  ];
}

function isActiveNavItem(pathname: string, href: string) {
  const normalizedPathname = getPathWithoutLocale(pathname);
  const normalizedHref = getPathWithoutLocale(href);
  if (normalizedHref === "/dashboard") return normalizedPathname === "/dashboard";
  if (normalizedHref === "/talks/new") return normalizedPathname === "/talks/new";
  if (normalizedHref === "/talks") return normalizedPathname === "/talks" || (normalizedPathname.startsWith("/talks/") && normalizedPathname !== "/talks/new");
  if (normalizedHref === "/settings") return normalizedPathname === "/settings";
  return normalizedPathname === normalizedHref;
}

export function Sidebar({ locale, talkCount, trialReminder, userName }: { locale: Locale; talkCount: number; trialReminder: TrialReminder | null; userName: string }) {
  const pathname = usePathname();
  const messages = getMessages(locale);
  const navItems = getNavItems(talkCount, locale);
  const helpHref = "mailto:support@solo-speaker.app?subject=Besoin%20d'aide%20Solo%20Speaker";
  const trialHref = trialReminder?.href.startsWith("/") ? localizedPath(trialReminder.href, locale) : (trialReminder?.href ?? "/pricing");

  return (
    <>
      <aside className="hidden w-[64px] shrink-0 flex-col border-r border-line bg-panel px-2 pb-4 pt-[18px] md:flex lg:w-[228px] lg:px-3">
        <div className="flex justify-center pb-4 lg:block lg:px-2">
          <Logo compact />
        </div>
        <CommandPalette locale={locale} talkCount={talkCount} />
        <p className="hidden px-2 pb-2 font-mono text-[10px] uppercase tracking-[.12em] text-faint lg:block">{messages.navigation.studio}</p>
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActiveNavItem(pathname, item.href);
            return (
              <Link
                aria-label={item.label}
                className={`flex h-9 items-center justify-center gap-2.5 rounded-lg px-2 text-[13.5px] transition lg:justify-start lg:py-2 ${
                  active ? "bg-surface font-medium text-ink shadow-[0_1px_2px_rgba(20,20,25,.05)]" : "text-mute hover:bg-surface/70 hover:text-ink"
                }`}
                data-tour={item.href === "/settings" ? "settings" : item.href === "/talks/new" ? "create-talk" : undefined}
                href={item.href}
                key={`${item.href}-${item.label}`}
                title={item.label}
              >
                <Icon className="size-4 opacity-85" />
                <span className="hidden lg:inline">{item.label}</span>
                {item.count ? <span className="ml-auto hidden font-mono text-[11px] text-faint lg:inline">{item.count}</span> : null}
              </Link>
            );
          })}
        </nav>
        <a
          className="mt-3 hidden h-9 items-center justify-center gap-2.5 rounded-lg border border-line bg-surface px-2 text-[13px] font-medium text-mute transition hover:text-ink lg:flex"
          href={helpHref}
        >
          <HelpCircle className="size-4" />
          {messages.common.help}
        </a>
        <RestartGuidedOnboardingButton />
        {trialReminder ? (
          <Link
            className="mt-3 hidden rounded-[10px] border border-[color-mix(in_oklab,var(--accent)_18%,var(--line))] bg-surface p-3 text-left transition hover:border-[color-mix(in_oklab,var(--accent)_36%,var(--line))] hover:bg-panel lg:block"
            href={trialHref}
          >
            <span className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.12em] text-faint">
              <CalendarClock className="size-3.5 text-accent-ink" />
              {trialReminder.label}
            </span>
            <span className="block text-[12.5px] font-[550] leading-5 text-foreground">{trialReminder.message}</span>
            <span className="mt-2 block text-[12px] font-[550] text-accent-ink">{trialReminder.ctaLabel}</span>
          </Link>
        ) : null}
        <div className="mt-auto border-t border-line pt-3">
          <div className="mb-3 flex justify-center lg:justify-start lg:px-2">
            <ThemeToggle className="w-[92px] lg:w-[96px]" />
          </div>
          <div className="mb-3 flex justify-center lg:justify-start lg:px-2">
            <LanguageSwitcher currentLocale={locale} />
          </div>
          <div className="flex items-center justify-center gap-2.5 lg:justify-start lg:px-2">
            <div className="flex size-6 items-center justify-center rounded-full bg-accent-bg text-[11px] font-semibold text-accent-ink">
              {userName.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden min-w-0 lg:block">
              <p className="m-0 truncate text-[12.5px] font-medium">{userName}</p>
              <p className="m-0 truncate text-[11px] text-faint">{messages.navigation.studioOwner}</p>
            </div>
            <LogoutButton ariaLabel={messages.common.logout} className="ml-auto hidden size-7 items-center justify-center rounded-md text-faint transition hover:bg-surface hover:text-ink lg:flex">
              <LogOut className="size-4" />
            </LogoutButton>
          </div>
        </div>
        <div className="mt-2 flex justify-center lg:hidden">
          <LogoutButton ariaLabel={messages.common.logout} className="flex size-8 items-center justify-center rounded-[8px] text-faint transition hover:bg-surface hover:text-ink">
            <LogOut className="size-4" />
          </LogoutButton>
        </div>
      </aside>

      <nav className="fixed inset-x-3 bottom-3 z-40 flex h-14 items-center justify-around gap-1 rounded-[14px] border border-line bg-panel/96 px-2 shadow-[0_12px_40px_rgba(20,20,25,.18)] backdrop-blur md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActiveNavItem(pathname, item.href);
          return (
            <Link
              aria-label={item.label}
              className={`flex size-10 items-center justify-center rounded-[10px] transition ${
                active ? "bg-surface text-ink shadow-[0_1px_2px_rgba(20,20,25,.08)]" : "text-mute hover:bg-surface/70 hover:text-ink"
              }`}
              data-tour={item.href === "/settings" ? "settings" : item.href === "/talks/new" ? "create-talk" : undefined}
              href={item.href}
              key={`mobile-${item.href}-${item.label}`}
              title={item.label}
            >
              <Icon className="size-4" />
            </Link>
          );
        })}
        <details className="relative">
          <summary aria-label={messages.common.menu} className="flex size-10 cursor-pointer list-none items-center justify-center rounded-[10px] text-mute transition hover:bg-surface/70 hover:text-ink [&::-webkit-details-marker]:hidden">
            <MoreHorizontal className="size-4" />
          </summary>
          <div className="absolute bottom-full right-0 z-50 mb-2 grid w-[232px] max-w-[calc(100vw-1.5rem)] gap-1 rounded-[12px] border border-line bg-background p-2 shadow-[0_18px_50px_rgba(20,20,25,.18)]">
            {trialReminder ? (
              <Link className="flex items-center gap-2 rounded-[8px] px-3 py-2 text-[13px] font-[550] text-muted transition hover:bg-surface hover:text-foreground" href={trialHref} title={trialReminder.message}>
                <CalendarClock className="size-4 text-accent-ink" />
                {trialReminder.label}
              </Link>
            ) : null}
            <a className="flex items-center gap-2 rounded-[8px] px-3 py-2 text-[13px] font-[550] text-muted transition hover:bg-surface hover:text-foreground" href={helpHref}>
              <HelpCircle className="size-4" />
              {messages.common.help}
            </a>
            <RestartGuidedOnboardingButton inline />
            <LogoutButton className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-left text-[13px] font-[550] text-muted transition hover:bg-surface hover:text-foreground">
              <LogOut className="size-4" />
              {messages.common.logout}
            </LogoutButton>
            <div className="mt-1 flex items-center justify-between gap-2 border-t border-line pt-2">
              <ThemeToggle className="w-[92px]" />
              <LanguageSwitcher currentLocale={locale} />
            </div>
          </div>
        </details>
      </nav>
    </>
  );
}
