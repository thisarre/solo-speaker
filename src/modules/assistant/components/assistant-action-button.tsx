import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

type AssistantActionButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
};

export function AssistantActionButton({ children, disabled, loading, onClick }: AssistantActionButtonProps) {
  return (
    <Button className="w-full justify-start" disabled={disabled || loading} onClick={onClick} size="sm" type="button" variant="ghost">
      {loading ? "Génération..." : children}
    </Button>
  );
}
