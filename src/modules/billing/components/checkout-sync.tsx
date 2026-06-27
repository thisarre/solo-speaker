"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function CheckoutSync() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const isCheckoutSuccess = searchParams.get("checkout") === "success";
    if (!isCheckoutSuccess || !sessionId) return;

    fetch("/api/billing/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId })
    }).then((res) => {
      router.replace(window.location.pathname);
      router.refresh();
      return res;
    }).catch((err) => {
      console.error("Billing sync failed:", err);
      router.replace(`${window.location.pathname}?error=sync-failed`);
    });
  }, [searchParams, router]);

  return null;
}
