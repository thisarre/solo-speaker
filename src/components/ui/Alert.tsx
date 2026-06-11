import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AlertProps = {
  children: ReactNode;
  className?: string;
};

export function Alert({ children, className }: AlertProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-[8px] border border-[color-mix(in_oklab,var(--danger)_32%,var(--line))] bg-[color-mix(in_oklab,var(--danger)_7%,var(--bg))] px-3 py-2 text-[12.5px] leading-5 text-[var(--danger)]",
        className
      )}
    >
      <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
