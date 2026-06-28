"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

// Handles Supabase implicit-flow redirects (invitation emails).
// The hash fragment #access_token=... is processed client-side here,
// then we look up the pending invitation and redirect to /join?token=xxx.
export default function AuthConfirmPage() {
  const router = useRouter();

  useEffect(() => {
    const locale = document.documentElement.lang === "fr" ? "fr" : "en";
    const supabase = createClient();

    // tokens-only encoding keeps the user object out of the cookie, so read the user via
    // getUser() (network-validated) instead of getSession().user. See [[auth-live-cookie-gotchas]].
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace(`/${locale}/login`);
        return;
      }

      const email = user.email;
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
