import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { talkStatusLabels, talkTypeLabels, type Talk } from "@/types/talk";

export function TalkCard({ talk }: { talk: Talk }) {
  return (
    <Link href={`/talks/${talk.id}`}>
      <Card className="group relative flex min-h-[164px] flex-col p-[18px] transition hover:-translate-y-px hover:border-faint hover:shadow-studio">
        <button aria-label="Plus d'options" className="absolute right-2.5 top-2.5 flex size-6 items-center justify-center rounded-md text-faint opacity-0 transition group-hover:opacity-100">
          <MoreHorizontal className="size-4" />
        </button>
        <Badge tone={talk.status === "ready" ? "accent" : "neutral"}>{talkTypeLabels[talk.type]}</Badge>
        <h2 className="mb-1.5 mt-2.5 line-clamp-2 text-[15px] font-semibold leading-[1.32] tracking-[0]">{talk.title}</h2>
        <div className="flex gap-3 whitespace-nowrap font-mono text-[10.5px] text-faint">
          <span>{talk.durationMinutes} min</span>
          <span>{talk.audience}</span>
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-line2 pt-3">
          <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-mute">
            <i className={`size-1.5 rounded-full ${talk.status === "ready" ? "bg-ok" : "bg-accent"}`} />
            {talkStatusLabels[talk.status]}
          </span>
          <span className="font-mono text-[10.5px] text-faint">{talk.updatedAtLabel}</span>
        </div>
      </Card>
    </Link>
  );
}
