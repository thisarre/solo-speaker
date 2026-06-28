import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/database.types";

export async function GET(request: NextRequest) {
  // Behind the reverse proxy request.url is the internal origin (0.0.0.0:3000); prefer the public site URL.
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? request.url;
  const response = NextResponse.redirect(new URL(`/login?message=${encodeURIComponent("Déconnexion effectuée.")}`, base));
  const { url, anonKey } = getSupabaseEnv();
  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  await supabase.auth.signOut();
  return response;
}
