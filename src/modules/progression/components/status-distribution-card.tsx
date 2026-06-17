import { Card } from "@/components/ui/Card";
import type { StatusDistribution } from "@/modules/progression/types";

export function StatusDistributionCard({ rows }: { rows: StatusDistribution[] }) {
  return (
    <Card className="min-w-0 p-5">
      <h2 className="m-0 text-[15px] font-semibold tracking-[0] text-ink">Répartition par statut</h2>
      <div className="mt-4 grid gap-3">
        {rows.map((row) => (
          <DistributionRow count={row.count} key={row.status} label={row.label} percent={row.percent} />
        ))}
      </div>
    </Card>
  );
}

function DistributionRow({ count, label, percent }: { count: number; label: string; percent: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between gap-3 text-[12.5px] text-mute">
        <span>{label}</span>
        <span className="font-mono text-[10.5px] text-faint">{count}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-line2">
        <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
