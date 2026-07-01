import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";
import type { Database } from "./database.types";

// No auth session — uses the anon key for public (unauthenticated) data reads.
export function createPublicClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createClient<Database>(url, anonKey);
}
