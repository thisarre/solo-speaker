"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";
import type { Database } from "./database.types";

export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  // Behind the reverse proxy Next sees HTTP, so @supabase/ssr omits the Secure flag — but the
  // site is HTTPS, where browsers (Brave/Safari) reject a non-Secure session cookie. Force it.
  return createBrowserClient<Database>(url, anonKey, {
    cookieOptions: { secure: process.env.NODE_ENV === "production" }
  });
}
