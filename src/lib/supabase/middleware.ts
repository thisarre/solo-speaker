import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";
import { isProtectedAppPath } from "@/modules/auth/security";
import { addLocaleToPath, defaultLocale, pickLocaleFromPath } from "@/i18n/routing";
import type { Database } from "./database.types";

export async function updateSession(request: NextRequest, locale: string) {
  // Build the downstream request headers freshly each time so they carry BOTH the
  // x-locale hint and any session cookies refreshed below (official @supabase/ssr
  // pattern). A stale header copy here makes Server Components miss the refreshed
  // token, retrigger a refresh that rotates-and-invalidates it, and log the user
  // out on the next navigation.
  const buildHeaders = () => {
    const headers = new Headers(request.headers);
    headers.set("x-locale", locale);
    return headers;
  };

  let response = NextResponse.next({ request: { headers: buildHeaders() } });
  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient<Database>(url, anonKey, {
    // Behind Caddy, Next sees HTTP and drops the Secure flag; force it in production so the
    // HTTPS site's session cookie is accepted (and re-set) by the browser.
    cookieOptions: { secure: process.env.NODE_ENV === "production" },
    cookies: {
      // encode "tokens-only": keep the user object out of the cookie so the per-request refresh
      // here never re-chunks it. Must match the browser + server clients. See [[auth-live-cookie-gotchas]].
      encode: "tokens-only",
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: buildHeaders() } });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const protectedPath = isProtectedAppPath(request.nextUrl.pathname);

  if (!user && protectedPath) {
    const locale = pickLocaleFromPath(request.nextUrl.pathname) ?? defaultLocale;
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = addLocaleToPath("/login", locale);
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    // Carry any cookies a getUser()-triggered refresh just wrote onto `response` over to the
    // redirect, so an in-flight token refresh/rotation is not dropped on the way to /login.
    const redirect = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return response;
}
