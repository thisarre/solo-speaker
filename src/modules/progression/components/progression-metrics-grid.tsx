import { Clock3, FileText, Layers3, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { ProgressionMetric } from "@/modules/progression/types";

const icons = [FileText, Sparkles, Clock3, Layers3];

export function ProgressionMetricsGrid({ metrics }: { metrics: ProgressionMetric[] }) {
  return (
    <section className="grid min-w-0 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric, index) => {
        const Icon = icons[index] ?? FileText;

        return (
          <Card className="min-w-0 p-4" key={metric.id}>
            <div className="mb-5 flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[.12em] text-faint">{metric.label}</span>
              <span className="flex size-8 items-center justify-center rounded-[8px] bg-panel text-mute">
                <Icon className="size-4" />
              </span>
            </div>
            <p className="m-0 text-[28px] font-semibold leading-none tracking-[0] text-ink">{metric.value}</p>
            <p className="m-0 mt-2 text-[12.5px] leading-5 text-mute">{metric.detail}</p>
          </Card>
        );
      })}
    </section>
  );
}
