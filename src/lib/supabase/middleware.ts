import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";
import { isProtectedAppPath } from "@/modules/auth/security";
import { addLocaleToPath, defaultLocale, pickLocaleFromPath } from "@/i18n/routing";
import type { Database } from "./database.types";

export async function updateSession(request: NextRequest, requestHeaders?: Headers) {
  let response = NextResponse.next({ request: { headers: requestHeaders ?? request.headers } });
  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: requestHeaders ?? request.headers } });
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
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
