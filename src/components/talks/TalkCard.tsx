import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Clock3, Layers3, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { talkStatusLabels, talkTypeLabels, type Talk } from "@/types/talk";

export function TalkCard({ talk }: { talk: Talk }) {
  const isReady = talk.status === "ready";
  const sectionCount = talk.sections.length;

  return (
    <Link className="group block focus-visible:outline-none" href={`/talks/${talk.id}`}>
      <Card className="relative flex min-h-[184px] flex-col overflow-hidden p-[18px] transition group-hover:-translate-y-px group-hover:border-faint group-hover:shadow-studio group-focus-visible:ring-2 group-focus-visible:ring-accent/35">
        <div className={`absolute inset-x-0 top-0 h-1 ${isReady ? "bg-ok" : "bg-accent"}`} />
        <div className="flex items-start justify-between gap-3">
          <Badge tone={isReady ? "accent" : "neutral"}>{talkTypeLabels[talk.type]}</Badge>
          <span className="flex items-center gap-1.5 whitespace-nowrap rounded-[7px] bg-panel px-2 py-1 text-[11px] font-medium text-mute">
            <i className={`size-1.5 rounded-full ${isReady ? "bg-ok" : "bg-accent"}`} />
            {talkStatusLabels[talk.status]}
          </span>
        </div>

        <h2 className="mb-3 mt-3 line-clamp-2 min-h-[42px] text-[16px] font-semibold leading-[1.32] tracking-[0] text-foreground">{talk.title}</h2>

        <div className="grid gap-2 text-[12px] text-muted">
          <TalkMeta icon={<Clock3 />} label={`${talk.durationMinutes} min`} />
          <TalkMeta icon={<Users />} label={talk.audience || "Audience à préciser"} />
          <TalkMeta icon={<Layers3 />} label={`${sectionCount} section${sectionCount > 1 ? "s" : ""}`} />
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-line2 pt-3">
          <span className="font-mono text-[10.5px] text-faint">{talk.updatedAtLabel}</span>
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground">
            Ouvrir
            <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </Card>
    </Link>
  );
}

function TalkMeta({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-[7px] bg-panel text-faint [&_svg]:size-3.5">{icon}</span>
      <span className="truncate">{label}</span>
    </span>
  );
}
