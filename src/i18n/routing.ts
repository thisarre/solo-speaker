export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

const unlocalizedPrefixes = ["/api", "/auth/callback", "/logout", "/_next"];

export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}

export function pickLocaleFromPath(pathname: string): Locale | null {
  const segment = pathname.split("/").filter(Boolean)[0];
  return isLocale(segment) ? segment : null;
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
