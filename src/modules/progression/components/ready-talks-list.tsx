import Link from "next/link";
import { Mic2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { TalkReadiness } from "@/modules/progression/types";
import { useI18n } from "@/i18n/client";
import { localizedPath } from "@/i18n/routing";

export function ReadyTalksList({ talks }: { talks: TalkReadiness[] }) {
  const { locale, messages } = useI18n();
  const copy = messages.progression;

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-[15px] font-semibold tracking-[0] text-ink">{copy.readyToPresent}</h2>
        <span className="font-mono text-[10.5px] text-faint">{talks.length}</span>
      </div>
      <div className="grid gap-2">
        {talks.length ? (
          talks.map((item) => (
            <article className="rounded-[8px] border border-line2 bg-bg px-3 py-3" key={item.talk.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="m-0 truncate text-[13.5px] font-[550] leading-5 text-ink">{item.talk.title || copy.untitled}</h3>
                  <p className="m-0 mt-1 font-mono text-[10.5px] text-faint">
                    {item.estimatedMinutes} min · {item.talk.sections.length} sections · {item.score}%
                  </p>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <Link href={localizedPath(`/talks/${item.talk.id}/speak`, locale)}>
                  <Button leftIcon={<Mic2 />} size="sm" variant="primary">{copy.present}</Button>
                </Link>
              </div>
            </article>
          ))
        ) : (
          <p className="m-0 rounded-[8px] border border-dashed border-line bg-bg px-3 py-4 text-[13px] leading-5 text-mute">
            {copy.noReady}
          </p>
        )}
      </div>
    </Card>
  );
}
