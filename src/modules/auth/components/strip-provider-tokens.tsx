"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";

// Google OAuth sessions carry provider_token / provider_refresh_token (~2 KB) we never use.
// They push the auth cookie past the chunk threshold (sb-<ref>-auth-token.0/.1). iOS Safari
// drops part of an oversized chunked cookie, which signs the user out on navigation.
// Re-store the session without the provider tokens so it stays a single, small cookie.
export function StripProviderTokens() {
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.provider_token || session?.provider_refresh_token) {
        void supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        });
      }
    });
  }, []);

  return null;
}
