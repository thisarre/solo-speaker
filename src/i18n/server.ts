import { notFound } from "next/navigation";
import { defaultLocale, isLocale, type Locale } from "./routing";

export type LocaleParams = Promise<{ locale: string }>;

export async function getLocaleFromParams(params: LocaleParams): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}

export function resolveServerLocale(headerLocale?: string | null, routeLocale?: string | null): Locale {
  const candidateRouteLocale = routeLocale ?? undefined;
  const candidateHeaderLocale = headerLocale ?? undefined;
  if (isLocale(candidateRouteLocale)) return candidateRouteLocale;
  if (isLocale(candidateHeaderLocale)) return candidateHeaderLocale;
  return defaultLocale;
}
