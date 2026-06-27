import { Activity } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { GlobalProgressionReport } from "@/modules/progression/types";
import { useI18n } from "@/i18n/client";

export function GlobalReadinessCard({ report }: { report: GlobalProgressionReport }) {
  const { messages } = useI18n();

  return (
    <Card className="min-w-0 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">{messages.progression.globalPreparation}</p>
          <h2 className="m-0 mt-2 text-[42px] font-semibold leading-none tracking-[0] text-ink">{report.score}%</h2>
        </div>
        <div className="flex size-10 items-center justify-center rounded-[10px] bg-accent-muted text-accent-ink">
          <Activity className="size-5" />
        </div>
      </div>
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[13px] font-[550] text-foreground">{report.label}</span>
          <span className="font-mono text-[10.5px] text-faint">{report.activeTalks} actifs</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-line2">
          <div className="h-full rounded-full bg-accent" style={{ width: `${report.score}%` }} />
        </div>
      </div>
    </Card>
  );
}
