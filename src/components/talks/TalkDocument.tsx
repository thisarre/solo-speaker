import { GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatDuration, sectionSeconds } from "@/lib/utils";
import { talkTypeLabels, type Talk } from "@/types/talk";

export function TalkDocument({ talk }: { talk: Talk }) {
  return (
    <article className="mx-auto w-full max-w-[692px] px-6 pb-28 pt-10 md:px-9">
      <div className="mb-3.5 flex gap-2">
        <Badge tone="accent">{talkTypeLabels[talk.type]}</Badge>
        <Badge>{talk.language}</Badge>
      </div>
      <h1 className="mb-7 text-[30px] font-semibold leading-[1.15] tracking-[0]">{talk.title}</h1>
      <div className="grid gap-3">
        {talk.sections.map((section, index) => (
          <section
            className={`rounded-[10px] border p-3.5 ${
              index === 1 ? "border-line bg-surface shadow-[0_1px_2px_rgba(20,20,25,.04)]" : "border-transparent"
            }`}
            key={section.id}
          >
            <div className="mb-2 flex items-center gap-2.5">
              <GripVertical className="size-3 text-faint" />
              <h2 className="m-0 flex-1 text-[15px] font-semibold tracking-[0]">{section.heading}</h2>
              <span className="font-mono text-[10.5px] text-faint">{formatDuration(sectionSeconds(section.heading, section.body))}</span>
            </div>
            <p className="m-0 max-w-[60ch] text-[14.5px] leading-7 text-mute">{section.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
