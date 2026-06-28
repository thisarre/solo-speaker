import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";
import type { Database } from "./database.types";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient<Database>(url, anonKey, {
    // Behind Caddy, Next sees HTTP and drops the Secure flag; force it in production so the
    // HTTPS site's session cookie is accepted by the browser.
    cookieOptions: { secure: process.env.NODE_ENV === "production" },
    cookies: {
      // encode "tokens-only": keep the user object out of the cookie so it never chunks. Must
      // match the browser + middleware clients. See [[auth-live-cookie-gotchas]].
      encode: "tokens-only",
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. Middleware refreshes sessions.
        }
      }
    }
  });
}
