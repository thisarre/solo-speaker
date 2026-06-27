import Link from "next/link";
import { ArrowRight, Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { ProgressionRecommendation } from "@/modules/progression/types";
import { useI18n } from "@/i18n/client";

export function ProgressionRecommendations({ recommendations }: { recommendations: ProgressionRecommendation[] }) {
  const { messages } = useI18n();

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-[15px] font-semibold tracking-[0] text-ink">{messages.progression.recommendations}</h2>
        <span className="font-mono text-[10.5px] text-faint">{recommendations.length}</span>
      </div>
      <div className="grid gap-2">
        {recommendations.map((recommendation) => (
          <div className="rounded-[8px] border border-line2 bg-bg px-3 py-2.5" key={recommendation.id}>
            <div className="flex items-start gap-2">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent-ink" />
              <p className="m-0 min-w-0 flex-1 text-[13px] leading-5 text-ink">{recommendation.message}</p>
            </div>
            {recommendation.href && recommendation.actionLabel ? (
              <Link className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-[550] text-accent-ink hover:text-accent" href={recommendation.href}>
                {recommendation.actionLabel}
                <ArrowRight className="size-3.5" />
              </Link>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
