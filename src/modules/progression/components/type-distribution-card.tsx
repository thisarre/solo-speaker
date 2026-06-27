import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { TypeDistribution } from "@/modules/progression/types";
import { useI18n } from "@/i18n/client";
import { localizedPath } from "@/i18n/routing";

export function TypeDistributionCard({ rows }: { rows: TypeDistribution[] }) {
  const { locale, messages } = useI18n();

  return (
    <Card className="p-5">
      <h2 className="m-0 text-[15px] font-semibold tracking-[0] text-ink">{messages.progression.typeDistribution}</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {rows.map((row) => (
          <Link
            className="rounded-[7px] border border-line bg-bg px-2.5 py-1.5 text-[12px] font-[550] text-mute transition hover:bg-panel hover:text-ink"
            href={localizedPath(`/talks?type=${row.type}`, locale)}
            key={row.type}
          >
            {row.label} · {row.count}
          </Link>
        ))}
      </div>
    </Card>
  );
}
