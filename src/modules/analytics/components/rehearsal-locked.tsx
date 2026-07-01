import Link from "next/link";
import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { localizedPath, type Locale } from "@/i18n/routing";
import type { Messages } from "@/i18n/messages";

type Props = {
  messages: Messages["analytics"];
  locale: Locale;
};

function MockBar({ h, accent }: { h: number; accent?: boolean }) {
  return (
    <div
      className={`w-3 rounded-t-sm ${accent ? "bg-accent/30" : "bg-mute/30"}`}
      style={{ height: `${h}px` }}
    />
  );
}

function MockCell({ level }: { level: 0 | 1 | 2 | 3 }) {
  const bg = level === 0 ? "bg-line" : level === 1 ? "bg-accent/20" : level === 2 ? "bg-accent/45" : "bg-accent/70";
  return <div className={`size-3 rounded-[2px] ${bg}`} />;
}

const mockBars = [55, 40, 70, 48, 62, 35, 78, 52, 45, 88, 60, 70];
const mockEstimates = [60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60];
const heatmapLevels: (0 | 1 | 2 | 3)[][] = [
  [0, 1, 0, 0, 2, 0, 1, 0, 0, 1, 0, 2, 0, 0, 1, 0],
  [1, 0, 0, 1, 0, 0, 2, 1, 0, 0, 1, 0, 0, 3, 0, 1],
  [0, 2, 1, 0, 0, 1, 0, 0, 2, 0, 0, 1, 2, 0, 0, 0],
  [0, 0, 0, 2, 1, 0, 0, 1, 0, 2, 1, 0, 0, 1, 0, 3],
  [1, 0, 2, 0, 0, 1, 0, 0, 1, 0, 2, 0, 1, 0, 2, 0],
  [0, 1, 0, 1, 0, 0, 3, 0, 0, 1, 0, 1, 0, 0, 1, 0],
  [0, 0, 1, 0, 2, 0, 0, 2, 0, 0, 0, 1, 0, 2, 0, 1]
];

export function RehearsalLocked({ messages, locale }: Props) {
  return (
    <div className="px-6 py-10 md:px-10 md:py-12">
      <div className="mb-8">
        <Badge tone="accent" className="mb-4">{messages.lockedBadge}</Badge>
        <h1 className="mb-2 text-[22px] font-semibold tracking-[-0.01em] text-ink">{messages.lockedTitle}</h1>
        <p className="text-[14px] text-mute">{messages.lockedSubtitle}</p>
      </div>

      <div className="relative overflow-hidden rounded-[16px] border border-line bg-surface">
        <div className="pointer-events-none select-none p-6 opacity-40 blur-[2px]" aria-hidden="true">
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[28, 2, 87, 6].map((v, i) => (
              <div key={i} className="rounded-[10px] border border-line bg-panel p-4">
                <div className="mb-1 text-[11px] uppercase tracking-[.09em] text-faint">—</div>
                <div className="text-[24px] font-semibold text-ink">{v}</div>
              </div>
            ))}
          </div>

          <div className="mb-6 rounded-[10px] border border-line bg-panel p-4">
            <div className="mb-3 text-[12px] font-medium text-mute">—</div>
            <div className="flex items-end gap-1" style={{ height: "96px" }}>
              {mockBars.map((h, i) => (
                <div key={i} className="flex flex-1 items-end gap-[2px]">
                  <MockBar h={Math.round((mockEstimates[i] / 100) * 80)} />
                  <MockBar h={Math.round((h / 100) * 80)} accent />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[10px] border border-line bg-panel p-4">
            <div className="mb-3 text-[12px] font-medium text-mute">—</div>
            <div
              className="grid gap-[3px]"
              style={{ gridTemplateRows: "repeat(7, 12px)", gridAutoFlow: "column" }}
            >
              {heatmapLevels.flat().map((level, i) => (
                <MockCell key={i} level={level} />
              ))}
            </div>
          </div>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-panel/60 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-4 rounded-[16px] border border-line bg-surface p-8 shadow-[0_8px_32px_rgba(20,20,25,.12)] max-w-sm w-full mx-4">
            <div className="flex size-12 items-center justify-center rounded-[12px] border border-line bg-panel">
              <Lock className="size-5 text-mute" />
            </div>
            <div className="text-center">
              <p className="mb-1 text-[15px] font-semibold text-ink">{messages.lockedTitle}</p>
              <p className="text-[13px] leading-5 text-mute">{messages.lockedBody}</p>
            </div>
            <ul className="w-full space-y-2">
              {messages.lockedFeatures.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-[12.5px] text-mute">
                  <span className="size-1.5 rounded-full bg-accent" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              className="mt-1 w-full rounded-[10px] bg-accent px-4 py-2.5 text-center text-[13.5px] font-[550] text-accent-ink transition hover:opacity-90"
              href={localizedPath("/pricing", locale)}
            >
              {messages.lockedCta}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
