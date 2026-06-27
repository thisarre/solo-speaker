"use client";

import Link from "next/link";
import posthog from "posthog-js";
import type { ReactNode } from "react";
import { buttonClassName } from "@/components/ui/Button";

type TrackedLinkButtonProps = {
  children: ReactNode;
  className?: string;
  event: "hero_cta_clicked" | "landing_cta_clicked" | "pricing_cta_clicked" | "use_case_clicked";
  href: string;
  leftIcon?: ReactNode;
  properties?: Record<string, string | number | boolean>;
  variant?: "primary" | "accent" | "ghost" | "quiet";
};

export type LandingAnalyticsEvent = TrackedLinkButtonProps["event"];

export function captureLandingEvent(event: LandingAnalyticsEvent, properties?: Record<string, string | number | boolean>) {
  posthog.capture(event, properties);
}

export function TrackedLinkButton({
  children,
  className,
  event,
  href,
  leftIcon,
  properties,
  variant = "ghost"
}: TrackedLinkButtonProps) {
  return (
    <Link
      className={buttonClassName({ className, variant })}
      href={href}
      onClick={() => posthog.capture(event, properties)}
    >
      {leftIcon ? <span className="flex [&_svg]:size-4">{leftIcon}</span> : null}
      {children}
    </Link>
  );
}
