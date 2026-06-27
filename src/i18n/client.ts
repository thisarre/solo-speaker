"use client";

import { usePathname } from "next/navigation";
import { getMessages } from "./messages";
import { defaultLocale, pickLocaleFromPath } from "./routing";

export function useI18n() {
  const pathname = usePathname();
  const locale = pickLocaleFromPath(pathname) ?? defaultLocale;

  return {
    locale,
    messages: getMessages(locale)
  };
}
