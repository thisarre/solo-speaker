import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock3, Globe } from "lucide-react";
import { getTalkByShareToken } from "@/modules/talks/public-queries";
import { talkTypeLabels } from "@/types/talk";
import { formatDuration } from "@/lib/utils";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function PublicTalkPage({ params }: Props) {
  const { token } = await params;
  const talk = await getTalkByShareToken(token);

  if (!talk) notFound();

  const totalSeconds = talk.sections.reduce((sum, s) => {
    const words = (s.heading + " " + s.body).trim().split(/\s+/).filter(Boolean).length;
    return sum + Math.round(words / 2.5);
  }, 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background px-4 py-3">
        <div className="mx-auto flex max-w-[780px] items-center justify-between gap-4">
          <Link className="font-semibold tracking-[-0.01em] text-foreground" href="/">
            Solo Speaker
          </Link>
          <span className="rounded-[6px] border border-border px-2 py-0.5 font-mono text-[10.5px] text-faint">
            Read-only
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[780px] px-4 pb-20 pt-10 sm:px-6">
        <div className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-[6px] bg-accent-muted px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[.08em] text-accent-ink">
              {talkTypeLabels[talk.type]}
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-faint">
              <Clock3 className="size-3" />
              {formatDuration(totalSeconds)}
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-faint">
              <Globe className="size-3" />
              {talk.language}
            </span>
          </div>

          <h1 className="text-[28px] font-bold leading-[1.15] tracking-[-0.02em] text-foreground sm:text-[34px]">
            {talk.title || "—"}
          </h1>

          {talk.audience ? (
            <p className="mt-2 text-[14px] text-muted">{talk.audience}</p>
          ) : null}
        </div>

        {talk.sections.length > 0 ? (
          <ol className="grid gap-5">
            {talk.sections.map((section, index) => (
              <li
                className="rounded-[14px] border border-border bg-surface shadow-[0_1px_2px_rgba(20,20,25,.03)]"
                key={section.id}
              >
                <div className="border-b border-line2 bg-[color-mix(in_oklab,var(--panel)_55%,var(--surface))] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-surface font-mono text-[10.5px] text-faint">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h2 className="text-[15px] font-semibold text-foreground">
                      {section.heading || "—"}
                    </h2>
                  </div>
                </div>
                {section.body ? (
                  <div className="px-4 py-4">
                    <p className="whitespace-pre-wrap text-[14px] leading-7 text-foreground">
                      {section.body}
                    </p>
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        ) : null}
      </main>

      <footer className="border-t border-border px-4 py-6 text-center font-mono text-[11px] text-faint">
        {"Created with "}
        <Link className="underline hover:text-muted" href="/">
          Solo Speaker
        </Link>
      </footer>
    </div>
  );
}
