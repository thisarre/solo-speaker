"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { getMessages } from "@/i18n/messages";
import { localizedPath, pickLocaleFromPath, type Locale } from "@/i18n/routing";

export function resolveLanguageSwitcherLocale(pathname: string, fallbackLocale: Locale) {
  return pickLocaleFromPath(pathname) ?? fallbackLocale;
}

export function getLanguageSwitcherOption(locale: Locale) {
  return locale === "fr" ? { flag: "🇫🇷", label: "FR" } : { flag: "🇬🇧", label: "EN" };
}

export function LanguageSwitcher({ className = "", currentLocale }: { className?: string; currentLocale: Locale }) {
  const pathname = usePathname();
  const activeLocale = resolveLanguageSwitcherLocale(pathname, currentLocale);
  const messages = getMessages(activeLocale);

  function buildHref(locale: Locale) {
    return localizedPath(pathname, locale);
  }

  function trackLanguageChange(nextLocale: Locale) {
    const previousLocale = activeLocale;
    if (previousLocale !== nextLocale) {
      posthog.capture("language_changed", {
        from: previousLocale,
        to: nextLocale,
        path: pathname
      });
    }
  }

  return (
    <div
      aria-label={messages.ui.language}
      className={`relative inline-grid grid-cols-2 rounded-[8px] border border-line bg-surface p-0.5 text-[11px] font-semibold ${className}`}
      role="group"
    >
      <span
        aria-hidden="true"
        className={`absolute bottom-0.5 top-0.5 w-[calc(50%_-_2px)] rounded-[6px] bg-accent shadow-[0_1px_2px_rgba(20,20,25,.12)] transition-transform duration-200 ease-out ${
          activeLocale === "fr" ? "translate-x-[calc(100%_+_2px)]" : "translate-x-0.5"
        }`}
      />
      {(["en", "fr"] as const).map((locale) => {
        const active = activeLocale === locale;
        const option = getLanguageSwitcherOption(locale);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            aria-pressed={active}
            className={`relative z-10 inline-flex items-center justify-center gap-1 rounded-[6px] px-2 py-1 text-center transition ${
              active ? "text-white" : "text-muted hover:text-foreground"
            }`}
            href={buildHref(locale)}
            key={locale}
            onClick={() => trackLanguageChange(locale)}
            role="button"
          >
            <span aria-hidden="true" className="text-[12px] leading-none">{option.flag}</span>
            <span>{option.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
