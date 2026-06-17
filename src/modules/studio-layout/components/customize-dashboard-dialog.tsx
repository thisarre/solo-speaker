"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { dashboardWidgetLabels } from "../dashboard-widget-registry";
import type { DashboardWidgetConfig } from "../types";

type CustomizeDashboardDialogProps = {
  onClose: () => void;
  onReset: () => void;
  onUpdate: (widgets: DashboardWidgetConfig[]) => void;
  widgets: DashboardWidgetConfig[];
};

export function CustomizeDashboardDialog({ onClose, onReset, onUpdate, widgets }: CustomizeDashboardDialogProps) {
  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);

  function commit(nextWidgets: DashboardWidgetConfig[]) {
    onUpdate(nextWidgets.map((widget, order) => ({ ...widget, order })));
  }

  function toggleVisibility(index: number) {
    commit(sortedWidgets.map((widget, currentIndex) => (currentIndex === index ? { ...widget, visible: !widget.visible } : widget)));
  }

  function move(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sortedWidgets.length) return;

    const nextWidgets = [...sortedWidgets];
    const [item] = nextWidgets.splice(index, 1);
    nextWidgets.splice(targetIndex, 0, item);
    commit(nextWidgets);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[color-mix(in_oklab,var(--ink)_24%,transparent)] px-4 py-6">
      <section className="w-full max-w-[560px] rounded-[10px] border border-border bg-background shadow-studio">
        <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 className="m-0 text-[16px] font-semibold tracking-[0] text-foreground">Personnaliser l&apos;accueil</h2>
            <p className="m-0 mt-1 text-[12.5px] leading-5 text-muted">Afficher, masquer ou réordonner les blocs du Dashboard.</p>
          </div>
          <Button aria-label="Fermer" onClick={onClose} size="icon" type="button" variant="quiet">
            <X className="size-4" />
          </Button>
        </header>
        <div className="grid gap-2 p-4">
          {sortedWidgets.map((widget, index) => (
            <div className="grid gap-2 rounded-[9px] border border-border bg-surface p-3 sm:grid-cols-[1fr_auto]" key={widget.id}>
              <div className="min-w-0">
                <p className="m-0 text-[13.5px] font-[550] text-foreground">{dashboardWidgetLabels[widget.id]}</p>
                <p className="m-0 mt-1 font-mono text-[10.5px] uppercase tracking-[.1em] text-faint">{widget.visible ? "Visible" : "Masqué"}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button aria-label="Monter" disabled={index === 0} onClick={() => move(index, -1)} size="icon" type="button" variant="quiet">
                  <ArrowUp className="size-4" />
                </Button>
                <Button aria-label="Descendre" disabled={index === sortedWidgets.length - 1} onClick={() => move(index, 1)} size="icon" type="button" variant="quiet">
                  <ArrowDown className="size-4" />
                </Button>
                <Button leftIcon={widget.visible ? <EyeOff /> : <Eye />} onClick={() => toggleVisibility(index)} size="sm" type="button" variant="ghost">
                  {widget.visible ? "Masquer" : "Afficher"}
                </Button>
              </div>
            </div>
          ))}
        </div>
        <footer className="flex flex-wrap justify-between gap-2 border-t border-border px-5 py-4">
          <Button leftIcon={<RotateCcw />} onClick={onReset} type="button" variant="quiet">Réinitialiser</Button>
          <Button onClick={onClose} type="button" variant="primary">Terminer</Button>
        </footer>
      </section>
    </div>
  );
}
