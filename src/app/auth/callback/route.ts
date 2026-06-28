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
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(buildAuthCallbackRedirect(base, next));
    }
  }

  return NextResponse.redirect(`${base.replace(/\/+$/, "")}/forgot-password?error=${encodeURIComponent("Le lien de réinitialisation est invalide ou expiré.")}`);
}
