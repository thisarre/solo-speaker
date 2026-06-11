import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[12px] border border-border bg-surface shadow-[0_1px_2px_rgba(20,20,25,.03)]",
        className
      )}
      {...props}
    />
  );
}
