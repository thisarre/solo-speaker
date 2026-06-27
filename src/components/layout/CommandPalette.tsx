"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { filterSearchActions, getSearchActions } from "./search-actions";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/i18n/routing";

export function CommandPalette({ locale = "en", talkCount }: { locale?: Locale; talkCount: number }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messages = getMessages(locale);
  const actions = useMemo(() => getSearchActions(talkCount, locale), [locale, talkCount]);
  const filteredActions = filterSearchActions(actions, query);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  return (
    <>
      <button
        className="mb-[18px] hidden w-full items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-2 text-left text-[12.5px] text-faint transition hover:text-ink lg:flex"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Search className="size-4" />
        <span>{messages.ui.search}</span>
        <span className="ml-auto rounded-[5px] bg-panel px-1.5 py-0.5 font-mono text-[10.5px]">⌘K</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] grid place-items-start bg-[color-mix(in_oklab,var(--ink)_34%,transparent)] px-4 pt-[18vh] backdrop-blur-sm" onMouseDown={() => setOpen(false)}>
          <section
            aria-modal="true"
            className="mx-auto grid w-full max-w-[560px] overflow-hidden rounded-[12px] border border-line bg-bg shadow-[0_24px_80px_rgba(10,10,16,.28)]"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="flex items-center gap-3 border-b border-line px-4 py-3">
              <Search className="size-4 text-faint" />
              <input
                className="h-9 min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-faint"
                onChange={(event) => setQuery(event.target.value)}
                placeholder={messages.ui.searchPlaceholder}
                ref={inputRef}
                value={query}
              />
              <button aria-label={messages.ui.close} className="rounded-[7px] p-1.5 text-faint transition hover:bg-panel hover:text-ink" onClick={() => setOpen(false)} type="button">
                <X className="size-4" />
              </button>
            </div>
            <div className="max-h-[320px] overflow-y-auto p-2">
              {filteredActions.length ? (
                filteredActions.map((action) => (
                  <Link
                    className="flex items-center justify-between gap-4 rounded-[9px] px-3 py-2.5 text-[13px] text-mute transition hover:bg-surface hover:text-ink"
                    href={action.href}
                    key={action.href}
                    onClick={() => setOpen(false)}
                  >
                    <span className="font-[550]">{action.label}</span>
                    <span className="font-mono text-[10.5px] text-faint">{action.meta}</span>
                  </Link>
                ))
              ) : (
                <p className="m-0 px-3 py-6 text-center text-[13px] text-faint">{messages.ui.noResults}</p>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
