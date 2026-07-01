export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

const unlocalizedPrefixes = ["/api", "/auth/callback", "/logout", "/ingest", "/_next", "/public"];

export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}

export function pickLocaleFromPath(pathname: string): Locale | null {
  const segment = pathname.split("/").filter(Boolean)[0];
  return isLocale(segment) ? segment : null;
}

// Name of the optional functional cookie that remembers a manual language choice.
export const LOCALE_COOKIE = "NEXT_LOCALE";

// Negotiate the best supported locale from a browser `Accept-Language` header
// (e.g. "fr-FR,fr;q=0.9,en;q=0.8" -> "fr"). Returns null if none match.
export function pickLocaleFromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? Number(qParam.trim().slice(2)) : 1;
      return { tag: tag.trim().toLowerCase(), q: Number.isFinite(q) ? q : 1 };
    })
    .filter((entry) => entry.tag.length > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return null;
}

export function getPathWithoutLocale(pathname: string) {
  const [pathPart, query = ""] = pathname.split("?");
  const parts = pathPart.split("/").filter(Boolean);

  if (isLocale(parts[0])) {
    const nextPath = `/${parts.slice(1).join("/")}`;
    return `${nextPath === "/" ? "/" : nextPath}${query ? `?${query}` : ""}`;
  }

  return pathname || "/";
}

export function shouldLocalizePath(pathname: string) {
  if (unlocalizedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return false;
  // Static files (robots.txt, sitemap.xml, og.png…) and generated metadata routes must not be localized.
  if (/\.[a-z0-9]+$/i.test(pathname)) return false;
  if (/^\/(opengraph-image|twitter-image|icon|apple-icon|sitemap|robots)(\/|$|\.)/.test(pathname)) return false;
  return true;
}

export function addLocaleToPath(pathname: string, locale: Locale) {
  if (!shouldLocalizePath(pathname)) return pathname;

  const [pathPart, query = ""] = pathname.split("?");
  const unlocalized = getPathWithoutLocale(pathPart);
  const suffix = unlocalized === "/" ? "" : unlocalized;

  return `/${locale}${suffix}${query ? `?${query}` : ""}`;
}

export function localizedPath(pathname: string, locale: Locale) {
  return addLocaleToPath(pathname, locale);
}

export function getLocalizedPathAlternates(pathname: string) {
  const path = getPathWithoutLocale(pathname);

  return {
    en: addLocaleToPath(path, "en"),
    fr: addLocaleToPath(path, "fr"),
    "x-default": addLocaleToPath(path, defaultLocale)
  };
}
