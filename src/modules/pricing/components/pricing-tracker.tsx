"use client";

import posthog from "posthog-js";
import { useEffect } from "react";

export function PricingTracker() {
  useEffect(() => {
    posthog.capture("pricing_page_viewed");
  }, []);

  return null;
}
