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

  return updateSession(request, locale);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
