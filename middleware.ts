import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { addLocaleToPath, defaultLocale, pickLocaleFromPath, shouldLocalizePath } from "@/i18n/routing";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (shouldLocalizePath(pathname) && !pickLocaleFromPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = addLocaleToPath(pathname, defaultLocale);
    return NextResponse.redirect(redirectUrl);
  }

  const locale = pickLocaleFromPath(pathname) ?? defaultLocale;

  // Prefetch requests must NOT trigger a Supabase token refresh. Next prefetches several links at
  // once; each would refresh the session concurrently, and the refresh-token rotation race
  // invalidates it — signing the user out on the next real navigation. Let prefetches pass through
  // untouched (they never need an auth redirect; the real navigation handles that).
  const isPrefetch =
    request.headers.get("next-router-prefetch") === "1" || request.headers.get("purpose") === "prefetch";
  if (isPrefetch) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-locale", locale);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return updateSession(request, locale);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
