"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";

export function GoogleAuthButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" disabled={pending} leftIcon={pending ? <Loader2 className="animate-spin" /> : <span className="font-semibold">G</span>} type="submit" variant="ghost">
      {pending ? pendingLabel : label}
    </Button>
  );
}
