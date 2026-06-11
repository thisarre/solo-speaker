"use client";

import { AlertTriangle, X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

type ConfirmDialogProps = {
  body: string;
  cancelLabel?: string;
  confirm: ReactNode;
  onClose: () => void;
  title: string;
};

export function ConfirmDialog({ body, cancelLabel = "Annuler", confirm, onClose, title }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_oklab,var(--ink)_34%,transparent)] p-4 backdrop-blur-sm">
      <section className="w-full max-w-[420px] rounded-[10px] border border-border bg-background shadow-studio">
        <header className="flex items-start gap-3 border-b border-border px-5 py-4">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-[color-mix(in_oklab,var(--danger)_10%,var(--bg))] text-[var(--danger)]">
            <AlertTriangle className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="m-0 text-[16px] font-semibold tracking-[0] text-foreground">{title}</h2>
            <p className="mt-1 text-[13px] leading-5 text-muted">{body}</p>
          </div>
          <Button aria-label="Fermer" onClick={onClose} size="icon" type="button" variant="quiet">
            <X className="size-4" />
          </Button>
        </header>
        <footer className="flex flex-wrap justify-end gap-2 px-5 py-4">
          <Button onClick={onClose} type="button" variant="quiet">{cancelLabel}</Button>
          {confirm}
        </footer>
      </section>
    </div>
  );
}
