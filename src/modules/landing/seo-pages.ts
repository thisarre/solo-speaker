import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/i18n/routing";

export const seoPageKeys = ["sermon-preparation", "public-speaking", "training-presentations", "ai-speech-writer", "teleprompter-mode"] as const;

export type SeoPageKey = (typeof seoPageKeys)[number];

export type SeoPageContent = {
  audience: string;
  description: string;
  eyebrow: string;
  highlights: string[];
  key: SeoPageKey;
  slug: string;
  title: string;
};

const seoPageSlugs: Record<SeoPageKey, string> = {
  "ai-speech-writer": "/features/ai-speech-writer",
  "public-speaking": "/use-cases/public-speaking",
  "sermon-preparation": "/use-cases/sermon-preparation",
  "teleprompter-mode": "/features/teleprompter-mode",
  "training-presentations": "/use-cases/training-presentations"
};

export function getSeoPage(locale: Locale, key: SeoPageKey): SeoPageContent {
  const page = getMessages(locale).seoPages[key];

  return {
    ...page,
    key,
    slug: seoPageSlugs[key]
  };
}

export const seoPages = Object.fromEntries(seoPageKeys.map((key) => [key, getSeoPage("en", key)])) as Record<SeoPageKey, SeoPageContent>;
