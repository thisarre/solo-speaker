import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "accent" | "success";
};

const tones = {
  neutral: "border-line2 bg-panel text-muted",
  accent: "border-transparent bg-accent-muted text-accent-ink",
  success: "border-transparent bg-[color-mix(in_oklab,var(--ok)_12%,transparent)] text-ok"
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[6px] border px-2 py-1 font-mono text-[10px] uppercase tracking-[.09em]",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
