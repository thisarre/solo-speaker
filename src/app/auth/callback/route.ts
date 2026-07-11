import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { buildAuthCallbackRedirect } from "@/modules/auth/security";
import { getPostHogClient } from "@/lib/posthog-server";
import type { Database } from "@/lib/supabase/database.types";

const INTERNAL_EMAILS = new Set(["thi.sarre@gmail.com"]);
const INTERNAL_DOMAINS = new Set(["solospeaker.fr"]);

function isInternalEmail(email: string | undefined): boolean {
  if (!email) return false;
  if (INTERNAL_EMAILS.has(email)) return true;
  const domain = email.split("@")[1];
  return Boolean(domain && INTERNAL_DOMAINS.has(domain));
}

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

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  // Behind the reverse proxy the internal request origin is 0.0.0.0:3000;
  // always redirect against the public site URL.
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  if (code) {
    const { url, anonKey } = getSupabaseEnv();
    const requestCookies = parseCookieHeader(request.headers.get("cookie") ?? "");
    // Capture the cookies @supabase/ssr wants to write and apply them DIRECTLY to the redirect
    // response below. The next/headers cookie store (used by the shared server client) does NOT
    // reliably propagate to a returned NextResponse from supabase-js's deferred auth-event write,
    // which is why Google logins authenticated server-side but no session cookie reached the
    // browser. This mirrors the middleware's response-based cookie pattern. See [[auth-live-cookie-gotchas]].
    const captured = new Map<string, CapturedCookie>();
    const supabase = createServerClient<Database>(url, anonKey, {
      cookieOptions: { secure: process.env.NODE_ENV === "production" },
      cookies: {
        // tokens-only: keep the user object out of the cookie so it never chunks (matches the
        // browser/server/middleware clients).
        encode: "tokens-only",
        getAll() {
          return requestCookies;
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach((cookie) => captured.set(cookie.name, cookie));
        }
      }
    });

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // Drop provider_token / provider_refresh_token (we never call Google APIs) so the cookie is
      // built from only the access + refresh tokens — smaller and never chunked.
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      });
      // supabase-js >= 2.91.0 defers the @supabase/ssr cookie write onto a timer. Poll until the
      // session cookie has actually been captured (container→Supabase latency makes a fixed delay
      // unreliable) before applying it to the redirect response.
      const hasAuthCookie = () =>
        [...captured.keys()].some((k) => k.includes("auth-token") && !k.includes("code-verifier"));
      for (let i = 0; i < 80 && !hasAuthCookie(); i++) {
        await new Promise((resolve) => setTimeout(resolve, 25));
      }

      const { user } = data;
      if (user && user.created_at && user.last_sign_in_at && !isInternalEmail(user.email)) {
        const diffMs = Math.abs(new Date(user.last_sign_in_at).getTime() - new Date(user.created_at).getTime());
        if (diffMs < 2 * 60 * 1000) {
          const providers = user.app_metadata?.providers;
          const method = Array.isArray(providers) && providers.includes("google") ? "google" : "email";
          getPostHogClient().capture({ distinctId: user.id, event: "user_signed_up_server", properties: { method } });
        }
      }

      const response = NextResponse.redirect(buildAuthCallbackRedirect(base, next));
      for (const { name, value, options } of captured.values()) {
        response.cookies.set(name, value, options);
      }
      return response;
    }
  }

  return NextResponse.redirect(`${base.replace(/\/+$/, "")}/forgot-password?error=${encodeURIComponent("Le lien de réinitialisation est invalide ou expiré.")}`);
}
