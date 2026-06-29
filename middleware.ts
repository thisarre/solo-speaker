import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  addLocaleToPath,
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  pickLocaleFromAcceptLanguage,
  pickLocaleFromPath,
  shouldLocalizePath
} from "@/i18n/routing";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (shouldLocalizePath(pathname) && !pickLocaleFromPath(pathname)) {
    // No locale in the path: pick the visitor's language. A previously-saved manual choice
    // (NEXT_LOCALE cookie) wins; otherwise negotiate from the Accept-Language header; finally
    // fall back to the default. No cookie is required for detection to work.
    const savedLocale = request.cookies.get(LOCALE_COOKIE)?.value;
    const preferred =
      (isLocale(savedLocale) ? savedLocale : null) ??
      pickLocaleFromAcceptLanguage(request.headers.get("accept-language")) ??
      defaultLocale;
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = addLocaleToPath(pathname, preferred);
    return NextResponse.redirect(redirectUrl);
  }

  const locale = pickLocaleFromPath(pathname) ?? defaultLocale;

  return updateSession(request, locale);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|ingest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
