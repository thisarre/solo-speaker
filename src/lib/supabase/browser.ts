"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";
import type { Database } from "./database.types";

export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  // Behind the reverse proxy Next sees HTTP, so @supabase/ssr omits the Secure flag — but the
  // site is HTTPS, where browsers (Brave/Safari) reject a non-Secure session cookie. Force it.
  // encode "tokens-only": store ONLY the access/refresh tokens in the cookie (the user object goes
  // to localStorage). A Google account's user object + JWT otherwise bloat the cookie past the
  // 3180-char chunk threshold; the resulting .0/.1 chunk cookies go inconsistent under the many
  // concurrent middleware requests a single navigation fires, fail to reassemble, and the user is
  // logged out. Must match the server + middleware clients. See [[auth-live-cookie-gotchas]].
  return createBrowserClient<Database>(url, anonKey, {
    cookieOptions: { secure: process.env.NODE_ENV === "production" },
    cookies: { encode: "tokens-only" }
  });
}
