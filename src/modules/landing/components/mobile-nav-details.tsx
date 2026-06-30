"use client";

import { useEffect, useRef, type ReactNode } from "react";

// A native <details> does not close when the user clicks elsewhere on the page. This thin client
// wrapper adds that: it closes the menu on an outside click (pointerdown, so it covers touch) and
// when a link inside the menu is clicked (so navigating / anchor-scrolling dismisses it too).
// The server component keeps rendering the summary + menu markup as children — only the <details>
// element itself becomes interactive here.
export function MobileNavDetails({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function closeOnOutside(event: PointerEvent) {
      const el = ref.current;
      // At pointerdown the native toggle hasn't run yet, so opening (summary click) sees open=false
      // and is ignored here; only a genuine outside click while open closes the menu.
      if (el?.open && !el.contains(event.target as Node)) {
        el.open = false;
      }
    }
    function closeOnLink(event: MouseEvent) {
      const el = ref.current;
      if (!el?.open) return;
      const link = (event.target as HTMLElement).closest("a[href]");
      if (link && el.contains(link)) {
        el.open = false;
      }
    }
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("click", closeOnLink);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("click", closeOnLink);
    };
  }, []);

  return (
    <details className={className} ref={ref}>
      {children}
    </details>
  );
}
