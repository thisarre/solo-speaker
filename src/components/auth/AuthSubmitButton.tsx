"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";

type AuthSubmitButtonProps = {
  idleLabel: string;
  pendingLabel: string;
};

export function AuthSubmitButton({ idleLabel, pendingLabel }: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" disabled={pending} leftIcon={pending ? <Loader2 className="animate-spin" /> : undefined} type="submit" variant="primary">
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}
