"use client";

import { Focus, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function FocusModeToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <Button leftIcon={enabled ? <Minimize2 /> : <Focus />} onClick={onToggle} size="sm" type="button" variant={enabled ? "primary" : "ghost"}>
      {enabled ? "Quitter focus" : "Focus"}
    </Button>
  );
}
