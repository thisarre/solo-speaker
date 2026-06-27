import en from "./messages/en.json";
import fr from "./messages/fr.json";
import { defaultLocale, type Locale } from "./routing";

export const messages = {
  en,
  fr
} as const;

export type Messages = typeof en;

export function getMessages(locale: Locale): Messages {
  return messages[locale] ?? messages[defaultLocale];
}

export function getText(locale: Locale, namespace: keyof Messages) {
  return getMessages(locale)[namespace];
}
