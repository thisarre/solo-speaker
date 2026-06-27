"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/client";

const themeOptions = [
  { value: "light", labelKey: "themeLight", icon: Sun },
  { value: "dark", labelKey: "themeDark", icon: Moon },
  { value: "system", labelKey: "themeSystem", icon: Monitor }
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, theme } = useTheme();
  const { messages } = useI18n();
  const selectedTheme = theme ?? "system";

  return (
    <div
      aria-label={messages.ui.theme}
      className={cn("inline-grid h-8 grid-cols-3 rounded-[8px] border border-line bg-surface p-0.5 text-faint shadow-[0_1px_2px_rgba(20,20,25,.04)]", className)}
      role="group"
    >
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const selected = selectedTheme === option.value;
        const label = messages.ui[option.labelKey];

        return (
          <button
            aria-label={label}
            aria-pressed={selected}
            className={cn(
              "flex size-7 items-center justify-center rounded-[6px] transition hover:text-foreground focus:outline-none focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_22%,transparent)]",
              selected ? "bg-panel text-foreground shadow-[0_1px_2px_rgba(20,20,25,.05)]" : "text-faint"
            )}
            key={option.value}
            onClick={() => setTheme(option.value)}
            suppressHydrationWarning
            title={label}
            type="button"
          >
            <Icon className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}
