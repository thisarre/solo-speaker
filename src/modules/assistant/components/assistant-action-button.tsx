import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

type AssistantActionButtonProps = {
  children: ReactNode;
  description?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
};

export function AssistantActionButton({ children, description, disabled, loading, onClick }: AssistantActionButtonProps) {
  return (
    <Button
      className="h-auto w-full cursor-pointer justify-start px-3 py-2 text-left transition duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_8px_22px_rgba(20,20,25,.08)] active:translate-y-0 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
      disabled={disabled || loading}
      onClick={onClick}
      size="sm"
      type="button"
      variant="ghost"
    >
      <span className="grid gap-0.5">
        <span>{loading ? "Génération..." : children}</span>
        {description ? <span className="text-[11px] font-normal leading-4 text-muted">{description}</span> : null}
      </span>
    </Button>
  );
}
