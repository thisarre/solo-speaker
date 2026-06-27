"use client";

import posthog from "posthog-js";
import { useEffect } from "react";

type PostHogIdentifyProps = {
  userId: string;
  name?: string;
  email?: string;
};

export function PostHogIdentify({ userId, name, email }: PostHogIdentifyProps) {
  useEffect(() => {
    posthog.identify(userId, {
      name,
      email
    });
  }, [userId, name, email]);

  return null;
}
