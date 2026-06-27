"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { captureLandingEvent, type LandingAnalyticsEvent } from "./tracked-link-button";

type TrackedCardLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick"> & {
  children: ReactNode;
  event: LandingAnalyticsEvent;
  href: string;
  properties?: Record<string, string | number | boolean>;
};

export function TrackedCardLink({ children, className, event, href, properties, ...props }: TrackedCardLinkProps) {
  return (
    <Link className={className} href={href} onClick={() => captureLandingEvent(event, properties)} {...props}>
      {children}
    </Link>
  );
}
