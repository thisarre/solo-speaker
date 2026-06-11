import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ className, label, id, ...props }: InputProps) {
  const input = (
    <input
      id={id}
      className={cn(
        "studio-input h-10 w-full rounded-[8px] border border-border bg-surface px-3 text-foreground outline-none transition placeholder:text-faint focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_16%,transparent)]",
        className
      )}
      {...props}
    />
  );

  if (!label) return input;

  return (
    <label className="flex flex-col gap-1.5 text-xs font-[550] text-muted" htmlFor={id}>
      {label}
      {input}
    </label>
  );
}
