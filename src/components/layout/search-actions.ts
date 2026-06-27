import { getMessages } from "@/i18n/messages";
import { localizedPath, type Locale } from "@/i18n/routing";

export type SearchAction = {
  href: string;
  keywords: string[];
  label: string;
  meta: string;
};

export function getSearchActions(talkCount: number, locale: Locale = "en"): SearchAction[] {
  const messages = getMessages(locale);
  const isFrench = locale === "fr";
  const talkCountMeta = isFrench ? `${talkCount} prise${talkCount > 1 ? "s" : ""} de parole` : `${talkCount} talk${talkCount > 1 ? "s" : ""}`;

  return [
    { href: localizedPath("/dashboard", locale), keywords: isFrench ? ["accueil", "studio", "dashboard"] : ["home", "studio", "dashboard"], label: messages.navigation.dashboard, meta: messages.ui.home },
    { href: localizedPath("/talks", locale), keywords: isFrench ? ["prises de parole", "discours", "liste"] : ["talks", "speeches", "list"], label: messages.talks.allTalks, meta: talkCountMeta },
    { href: localizedPath("/talks/new?guided=1", locale), keywords: isFrench ? ["nouveau", "creer", "créer", "brouillon"] : ["new", "create", "draft"], label: messages.common.createTalk, meta: messages.talks.newTalk },
    { href: localizedPath("/progression", locale), keywords: isFrench ? ["progression", "preparation", "préparation"] : ["progress", "readiness", "preparation"], label: messages.progression.title, meta: messages.progression.subtitle },
    { href: localizedPath("/settings", locale), keywords: isFrench ? ["reglages", "réglages", "prompteur", "ia", "assistant"] : ["settings", "teleprompter", "ai", "assistant"], label: messages.navigation.settings, meta: messages.navigation.studio }
  ];
}

export function filterSearchActions(actions: SearchAction[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return actions;

  return actions.filter((action) => {
    const searchable = [action.label, action.meta, ...action.keywords].join(" ").toLowerCase();
    return searchable.includes(normalizedQuery);
  });
}
