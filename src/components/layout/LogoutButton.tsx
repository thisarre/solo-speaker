"use client";

import type { ReactNode } from "react";
import { logout } from "@/modules/auth/actions";

// Logout MUST be a POST action, never a GET <Link>: Next.js prefetches visible links, so a
// GET /logout route would be fired in the background just by rendering the sidebar, silently
// signing the user out before their next navigation. A form posting to the server action is
// never prefetched and only runs on an explicit click. See [[auth-live-cookie-gotchas]].
export function LogoutButton({
  className,
  ariaLabel,
  children
}: {
  className?: string;
  ariaLabel?: string;
  children: ReactNode;
}) {
  return (
    <form action={logout} className="contents">
      <button type="submit" aria-label={ariaLabel} className={`cursor-pointer ${className ?? ""}`}>
        {children}
      </button>
    </form>
  );
}
