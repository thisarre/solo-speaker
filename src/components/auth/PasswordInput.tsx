"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
};

export function PasswordInput({ className, label, id, ...props }: PasswordInputProps) {
  const [show, setShow] = useState(false);

  const input = (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        className={cn(
          "studio-input h-10 w-full rounded-[8px] border border-border bg-surface px-3 pr-9 text-foreground outline-none transition placeholder:text-faint focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_16%,transparent)]",
          className
        )}
        {...props}
      />
      <button
        aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-faint hover:text-ink"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
        type="button"
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );

  if (!label) return input;

  return (
    <label className="flex flex-col gap-1.5 text-xs font-[550] text-muted" htmlFor={id}>
      {label}
      {input}
    </label>
  );
}
