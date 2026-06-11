import Link from "next/link";
import { ChevronLeft, ChevronRight, Maximize2, Mic, Pause, Settings } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Talk } from "@/types/talk";

function renderCueText(text: string) {
  return text.split(/(\[[^\]]+\])/g).map((part, index) =>
    /^\[[^\]]+\]$/.test(part) ? (
      <span className="font-semibold text-[#9d9bff]" key={`${part}-${index}`}>
        {part}
      </span>
    ) : (
      part
    )
  );
}

export function SpeakingPreview({ talk }: { talk: Talk }) {
  const paragraphs = talk.sections.flatMap((section) => [
    { id: `${section.id}-h`, kind: "heading" as const, text: section.heading },
    { id: section.id, kind: "body" as const, text: section.body }
  ]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0b0d] text-[#ececf1]">
      <div className="flex min-w-0 flex-1 flex-col">
      <header className="relative flex h-[54px] shrink-0 items-center border-b border-[#1a1b20] px-6 font-mono text-[11px] uppercase tracking-[.08em] text-[#5f606b]">
        <Link className="transition hover:text-[#ececf1]" href={`/talks/${talk.id}`}>
          Studio
        </Link>
        <div className="absolute left-1/2 flex -translate-x-1/2 items-baseline gap-2 whitespace-nowrap text-[15px] tracking-[.04em] text-[#ececf1]">
          08:12 <span className="text-[11px] text-[#5f606b]">/ {talk.durationMinutes}:00</span>
        </div>
        <span className="ml-auto whitespace-nowrap">{talk.sections[0]?.heading}</span>
      </header>
      <main className="relative min-h-0 flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0a0b0d] to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0a0b0d] to-transparent" />
        <div className="absolute left-8 top-1/2 h-0.5 w-5 rounded bg-[#7b79ff] md:left-[70px]" />
        <div className="mx-auto max-w-[920px] px-8 py-[18vh] md:px-[60px]">
          {paragraphs.slice(0, 7).map((item, index) =>
            item.kind === "heading" ? (
              <p
                className={`mb-4 mt-10 font-mono text-[15px] uppercase tracking-[.14em] ${
                  index === 2 ? "text-[#9d9bff]" : "text-[#5f606b]"
                }`}
                key={item.id}
              >
                {item.text}
              </p>
            ) : (
              <p
                className={`mb-7 text-[clamp(28px,4vw,40px)] font-normal leading-[1.52] tracking-[0] ${
                  index === 1 ? "text-white" : index < 1 ? "text-[#3c3d46]" : "text-[#6b6c78]"
                }`}
                key={item.id}
              >
                {renderCueText(item.text)}
              </p>
            )
          )}
        </div>
      </main>
      <div className="h-[3px] bg-[#1a1b20]">
        <div className="h-full w-[42%] bg-[#7b79ff]" />
      </div>
      <footer className="flex shrink-0 justify-center px-4 pb-6 pt-5">
        <div className="flex items-center gap-1 rounded-xl border border-[#23242b] bg-[#141519] p-1.5 shadow-[0_8px_30px_rgba(0,0,0,.5)]">
          <Button className="border-0 bg-transparent text-[#9092a0] hover:bg-[#1e1f25] hover:text-[#ececf1]" size="icon">
            <ChevronLeft className="size-4" />
          </Button>
          <Button className="min-w-11 border-0 bg-[#ececf1] text-[#101114] hover:bg-white" size="icon">
            <Pause className="size-4" />
          </Button>
          <Button className="border-0 bg-transparent text-[#9092a0] hover:bg-[#1e1f25] hover:text-[#ececf1]" size="icon">
            <ChevronRight className="size-4" />
          </Button>
          <div className="mx-1 h-5 w-px bg-[#23242b]" />
          <Button className="border-0 bg-transparent text-[#9092a0] hover:bg-[#1e1f25] hover:text-[#ececf1]" size="icon">
            <Mic className="size-4" />
          </Button>
          <Button className="border-0 bg-transparent text-[#9092a0] hover:bg-[#1e1f25] hover:text-[#ececf1]" size="icon">
            <Settings className="size-4" />
          </Button>
          <Button className="border-0 bg-transparent text-[#9092a0] hover:bg-[#1e1f25] hover:text-[#ececf1]" size="icon">
            <Maximize2 className="size-4" />
          </Button>
        </div>
      </footer>
      </div>
    </div>
  );
}
