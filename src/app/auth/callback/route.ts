import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildAuthCallbackRedirect } from "@/modules/auth/security";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  // Behind the reverse proxy the internal request origin is 0.0.0.0:3000;
  // always redirect against the public site URL.
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // Google sessions carry provider_token / provider_refresh_token, which bloat the auth
      // cookie past the 3180-char chunk threshold so @supabase/ssr splits it into
      // sb-<ref>-auth-token.0/.1 — and chunked cookies get dropped on client-side navigation,
      // signing the user out. We never call Google APIs on the user's behalf, so re-set the
      // session from ONLY the access + refresh tokens: the persisted cookie is then built
      // without the provider tokens and stays a single, un-chunked cookie.
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      });
      // supabase-js >= 2.91.0 defers its SIGNED_IN event (which triggers the @supabase/ssr
      // cookie write) onto a setTimeout(0). In a route handler the redirect would otherwise be
      // sent before that callback runs, so NO cookie gets written and login silently fails.
      // Flushing the timer queue lets the cookie write complete before we redirect.
      await new Promise((resolve) => setTimeout(resolve, 0));
      return NextResponse.redirect(buildAuthCallbackRedirect(base, next));
    }
  }

  return NextResponse.redirect(`${base.replace(/\/+$/, "")}/forgot-password?error=${encodeURIComponent("Le lien de réinitialisation est invalide ou expiré.")}`);
}
