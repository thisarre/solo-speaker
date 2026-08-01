"use client";

import posthog from "posthog-js";
import { useEffect } from "react";

type PostHogIdentifyProps = {
  userId: string;
  name?: string;
  email?: string;
  /**
   * Stamped as a person property so every event — including the server-side
   * generation and usage events, which only carry a distinct id — can be broken
   * down by plan. Without it there is no way to compare cost against revenue.
   */
  billingPlan?: string;
};

export function PostHogIdentify({ userId, name, email, billingPlan }: PostHogIdentifyProps) {
  useEffect(() => {
    posthog.identify(userId, {
      name,
      email,
      billing_plan: billingPlan
    });
  }, [userId, name, email, billingPlan]);

  return null;
}
