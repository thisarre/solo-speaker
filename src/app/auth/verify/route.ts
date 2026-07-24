import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { buildAuthCallbackRedirect } from "@/modules/auth/security";
import type { Database } from "@/lib/supabase/database.types";

// Email-link verification via token_hash + verifyOtp. Unlike the PKCE code exchange in
// /auth/callback, this flow needs NO code_verifier cookie, so it works when the link is opened in
// a different browser than the one that requested it — e.g. a mail app's in-app browser. Used for
// recovery, signup confirmation, magic link and email-change templates. See [[auth-live-cookie-gotchas]].

type CapturedCookie = { name: string; value: string; options?: Record<string, unknown> };

function parseCookieHeader(header: string): { name: string; value: string }[] {
  return header
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const eq = part.indexOf("=");
      if (eq < 0) return { name: part, value: "" };
      return { name: part.slice(0, eq), value: decodeURIComponent(part.slice(eq + 1)) };
    });
}

const ALLOWED_TYPES: ReadonlySet<string> = new Set([
  "recovery",
  "signup",
  "magiclink",
  "invite",
  "email",
  "email_change"
]);

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? requestUrl.origin;
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next");

  if (tokenHash && type && ALLOWED_TYPES.has(type)) {
    const { url, anonKey } = getSupabaseEnv();
    const requestCookies = parseCookieHeader(request.headers.get("cookie") ?? "");
    const captured = new Map<string, CapturedCookie>();
    const supabase = createServerClient<Database>(url, anonKey, {
      cookieOptions: { secure: process.env.NODE_ENV === "production" },
      cookies: {
        encode: "tokens-only",
        getAll() {
          return requestCookies;
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach((cookie) => captured.set(cookie.name, cookie));
        }
      }
    });

    const { data, error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash
    });

    if (!error && data.session) {
      // Rebuild the cookie from only access + refresh tokens (drop provider tokens) so it never
      // chunks — mirrors /auth/callback.
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      });
      const hasAuthCookie = () =>
        [...captured.keys()].some((k) => k.includes("auth-token") && !k.includes("code-verifier"));
      for (let i = 0; i < 80 && !hasAuthCookie(); i++) {
        await new Promise((resolve) => setTimeout(resolve, 25));
      }

      const response = NextResponse.redirect(buildAuthCallbackRedirect(base, next));
      for (const { name, value, options } of captured.values()) {
        response.cookies.set(name, value, options);
      }
      return response;
    }
  }

  const errorTarget = type === "recovery" ? "/forgot-password" : "/login";
  return NextResponse.redirect(
    `${base.replace(/\/+$/, "")}${errorTarget}?error=${encodeURIComponent("Le lien est invalide ou expiré. Merci d'en demander un nouveau.")}`
  );
}
