import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildAuthCallbackRedirect } from "@/modules/auth/security";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(buildAuthCallbackRedirect(requestUrl.origin, next));
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/forgot-password?error=${encodeURIComponent("Le lien de réinitialisation est invalide ou expiré.")}`);
}
