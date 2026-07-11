"use client";

import posthog from "posthog-js";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";

const INTERNAL_EMAILS = new Set(["thi.sarre@gmail.com"]);
const INTERNAL_DOMAINS = new Set(["solospeaker.fr"]);

function isInternalEmail(email: string | undefined): boolean {
  if (!email) return false;
  if (INTERNAL_EMAILS.has(email)) return true;
  const domain = email.split("@")[1];
  return Boolean(domain && INTERNAL_DOMAINS.has(domain));
}

function isNewSignup(createdAt: string, lastSignInAt: string): boolean {
  return Math.abs(new Date(lastSignInAt).getTime() - new Date(createdAt).getTime()) < 2 * 60 * 1000;
}

export function AuthTracker() {
  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) return;
      const { user } = session;

      if (isInternalEmail(user.email)) return;

      posthog.identify(user.id, {
        email: user.email,
        name: user.user_metadata?.full_name as string | undefined
      });

      const storageKey = `ph_signed_up_${user.id}`;
      if (localStorage.getItem(storageKey)) return;

      if (user.created_at && user.last_sign_in_at && isNewSignup(user.created_at, user.last_sign_in_at)) {
        const providers = user.app_metadata?.providers;
        const method = Array.isArray(providers) && providers.includes("google") ? "google" : "email";
        posthog.capture("user_signed_up", { method });
        localStorage.setItem(storageKey, "1");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
