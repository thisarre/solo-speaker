"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/env";

// Handles Supabase implicit-flow redirects (invitation emails).
// The hash fragment #access_token=... is processed client-side here,
// then we look up the pending invitation and redirect to /join?token=xxx.
export default function AuthConfirmPage() {
  const router = useRouter();

  useEffect(() => {
    const locale = document.documentElement.lang === "fr" ? "fr" : "en";
    const env = getSupabaseEnv();
    const supabase = createBrowserClient(env.url, env.anonKey);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace(`/${locale}/login`);
        return;
      }

      const email = session.user.email;
      if (!email) {
        router.replace(`/${locale}/dashboard`);
        return;
      }

      // Accept pending invitation via admin route (bypasses RLS)
      await fetch("/api/team/accept", { method: "POST" });

      router.replace(`/${locale}/dashboard`);
    });
  }, [router]);

  return (
    <div className="flex h-[100svh] items-center justify-center">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
    </div>
  );
}
