import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

export function Textarea({ className, label, id, ...props }: TextareaProps) {
  const textarea = (
    <textarea
      id={id}
      className={cn(
        "studio-textarea min-h-28 w-full resize-none rounded-[9px] border border-border bg-surface px-3 py-2.5 leading-6 text-foreground outline-none transition placeholder:text-faint focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_16%,transparent)]",
        className
      )}
      {...props}
    />
  );

  if (!label) return textarea;

  return (
    <label className="flex flex-col gap-1.5 text-xs font-[550] text-muted" htmlFor={id}>
      {label}
      {textarea}
    </label>
  );
}
