import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "accent" | "ghost" | "quiet";
type ButtonSize = "sm" | "md" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
};

const variants: Record<ButtonVariant, string> = {
  primary: "studio-button-primary hover:opacity-90",
  accent: "studio-button-accent hover:opacity-90",
  ghost: "border-border bg-surface text-foreground shadow-[0_1px_2px_rgba(20,20,25,.04)] hover:bg-panel",
  quiet: "bg-transparent text-muted hover:text-foreground"
};

const sizes: Record<ButtonSize, string> = {
  sm: "studio-button-sm h-8 rounded-[7px] px-3",
  md: "studio-button h-9 rounded-[8px] px-3.5",
  icon: "size-8 rounded-[8px] p-0"
};

export function buttonClassName({ className, size = "md", variant = "ghost" }: { className?: string; size?: ButtonSize; variant?: ButtonVariant } = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 border border-transparent font-[550] leading-none tracking-[0] transition focus:outline-none focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_22%,transparent)] active:scale-[.98] aria-disabled:pointer-events-none aria-disabled:opacity-50",
    variants[variant],
    sizes[size],
    className
  );
}

export function Button({
  className,
  variant = "ghost",
  size = "md",
  leftIcon,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonClassName({ className, size, variant }), "disabled:pointer-events-none disabled:opacity-50")}
      {...props}
    >
      {leftIcon ? <span className="flex [&_svg]:size-4">{leftIcon}</span> : null}
      {children}
    </button>
  );
}
