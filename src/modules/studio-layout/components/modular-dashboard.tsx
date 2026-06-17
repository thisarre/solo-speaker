"use client";

import Link from "next/link";
import { Archive, ArrowRight, Clock3, FileText, Mic2, Plus, Settings2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { type Talk } from "@/types/talk";
import { DashboardMetric, buildDashboardWidgetData, renderDashboardWidget } from "../dashboard-widget-registry";
import { useDashboardLayout } from "../layout-storage";
import { CustomizeDashboardDialog } from "./customize-dashboard-dialog";
import { useState } from "react";

export function ModularDashboard({ talks }: { talks: Talk[] }) {
  const [customizing, setCustomizing] = useState(false);
  const { layout, reset, updateWidgets } = useDashboardLayout();
  const data = buildDashboardWidgetData(talks);
  const visibleWidgets = [...layout.widgets].sort((a, b) => a.order - b.order).filter((widget) => widget.visible);
  const currentTalk = data.currentTalk;

  return (
    <div className="studio-scroll h-screen overflow-y-auto px-6 py-8 md:px-11">
      <section className="rounded-[8px] border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(20,20,25,.04)] md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge tone="accent">Studio</Badge>
            <h1 className="m-0 mt-3 text-[30px] font-semibold leading-tight tracking-[0] md:text-[38px]">
              {currentTalk ? "Reprenez votre prochain talk là où vous l'avez laissé." : "Préparez votre premier talk sans vous disperser."}
            </h1>
            <p className="m-0 mt-3 max-w-xl text-[14px] leading-6 text-muted">
              {currentTalk
                ? "Structurez, améliorez et répétez depuis un seul espace. Le Dashboard garde l'action suivante visible."
                : "Créez un talk, précisez l'audience, puis avancez jusqu'au mode prompteur quand le texte est prêt."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button leftIcon={<Settings2 />} onClick={() => setCustomizing(true)} variant="ghost">Personnaliser</Button>
            <Link href="/talks/new">
              <Button leftIcon={<Plus />} variant="primary">Créer un talk</Button>
            </Link>
          </div>
        </div>

        {currentTalk ? (
          <div className="mt-6 grid gap-3 border-t border-line pt-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">À reprendre</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <h2 className="m-0 truncate text-[18px] font-semibold tracking-[0]">{currentTalk.title}</h2>
                <span className="font-mono text-[11px] text-faint">{currentTalk.durationMinutes} min</span>
                <span className="font-mono text-[11px] text-faint">{currentTalk.sections.length} sections</span>
                <span className="font-mono text-[11px] text-faint">{currentTalk.updatedAtLabel}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/talks/${currentTalk.id}`}>
                <Button leftIcon={<ArrowRight />} variant="primary">Continuer la préparation</Button>
              </Link>
              <Link href={`/talks/${currentTalk.id}/speak`}>
                <Button leftIcon={<Mic2 />} variant="ghost">Répéter</Button>
              </Link>
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-7 grid gap-3.5 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetric icon={<FileText />} label="Talks actifs" value={data.activeTalks.length} detail={`${talks.length} dans le studio`} />
        <DashboardMetric icon={<Sparkles />} label="Prêts à présenter" value={data.readyTalks.length} detail={`${data.draftTalks.length} à finaliser`} />
        <DashboardMetric icon={<Clock3 />} label="Temps estimé" value={`${data.totalMinutes} min`} detail={`${data.totalSections} sections préparées`} />
        <DashboardMetric icon={<Archive />} label="Archivés" value={data.archivedTalks.length} detail="Hors travail courant" />
      </section>

      {visibleWidgets.length ? (
        <section className="mt-7 grid gap-5 xl:grid-cols-2">
          {visibleWidgets.map((widget) => (
            <div className={widget.size === "large" ? "xl:col-span-2" : ""} key={widget.id}>
              {renderDashboardWidget(widget.id, data)}
            </div>
          ))}
        </section>
      ) : (
        <div className="mt-8">
          <EmptyState
            action={<Button leftIcon={<Settings2 />} onClick={reset} type="button" variant="primary">Réinitialiser</Button>}
            icon={<Settings2 />}
            title="Accueil vide"
            description="Tous les widgets sont masqués. Réinitialisez la disposition pour retrouver le Dashboard par défaut."
          />
        </div>
      )}

      {customizing ? (
        <CustomizeDashboardDialog
          onClose={() => setCustomizing(false)}
          onReset={reset}
          onUpdate={updateWidgets}
          widgets={layout.widgets}
        />
      ) : null}
    </div>
  );
}
