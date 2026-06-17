"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "light", label: "Clair", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
  { value: "system", label: "Système", icon: Monitor }
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, theme } = useTheme();
  const selectedTheme = theme ?? "system";

  return (
    <div
      aria-label="Choisir le thème"
      className={cn("inline-grid h-8 grid-cols-3 rounded-[8px] border border-line bg-surface p-0.5 text-faint shadow-[0_1px_2px_rgba(20,20,25,.04)]", className)}
      role="group"
    >
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const selected = selectedTheme === option.value;

        return (
          <button
            aria-label={`Thème ${option.label}`}
            aria-pressed={selected}
            className={cn(
              "flex size-7 items-center justify-center rounded-[6px] transition hover:text-foreground focus:outline-none focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_22%,transparent)]",
              selected ? "bg-panel text-foreground shadow-[0_1px_2px_rgba(20,20,25,.05)]" : "text-faint"
            )}
            key={option.value}
            onClick={() => setTheme(option.value)}
            suppressHydrationWarning
            title={`Thème ${option.label}`}
            type="button"
          >
            <Icon className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}
