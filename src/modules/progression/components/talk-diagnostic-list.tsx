import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { TalkReadiness } from "@/modules/progression/types";
import { useI18n } from "@/i18n/client";
import { localizedPath } from "@/i18n/routing";

export function TalkDiagnosticList({ talks }: { talks: TalkReadiness[] }) {
  const { locale, messages } = useI18n();
  const copy = messages.progression;

  if (!talks.length) return null;

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <AlertCircle className="size-4 shrink-0 text-mute" />
        <h2 className="m-0 text-[15px] font-semibold tracking-[0] text-ink">{copy.diagnostic.title}</h2>
        <span className="ml-auto font-mono text-[10.5px] text-faint">{talks.length}</span>
      </div>
      <div className="grid gap-2">
        {talks.map((item) => (
          <article className="rounded-[8px] border border-line2 bg-bg px-3 py-3" key={item.talk.id}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="m-0 truncate text-[13.5px] font-[550] leading-5 text-ink">
                {item.talk.title || copy.untitled}
              </h3>
              <span className="font-mono text-[11px] text-faint">{item.score}%</span>
            </div>
            <ul className="m-0 mt-2 flex list-none flex-wrap gap-1.5 p-0">
              {item.missing.slice(0, 3).map((cause, i) => (
                <li key={i} className="m-0 p-0">
                  <Link
                    href={localizedPath(`/talks/${item.talk.id}`, locale)}
                    className="flex items-center gap-1 rounded-[6px] border border-line2 bg-panel px-2 py-1 text-[11.5px] text-mute transition-colors hover:border-accent hover:text-accent"
                  >
                    {cause}
                    <ArrowRight className="size-3 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </Card>
  );
}
