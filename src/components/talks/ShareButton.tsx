"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/client";

type ShareButtonProps = {
  title: string;
};

export function ShareButton({ title }: ShareButtonProps) {
  const { messages } = useI18n();
  const copy = messages.editor;
  const [feedback, setFeedback] = useState<"copied" | "error" | null>(null);

  async function handleShare() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled or share failed — no feedback needed
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setFeedback("copied");
      window.setTimeout(() => setFeedback(null), 2400);
    } catch {
      setFeedback("error");
      window.setTimeout(() => setFeedback(null), 2400);
    }
  }

  return (
    <div className="relative">
      <Button leftIcon={<Share2 />} onClick={handleShare} size="sm" type="button" variant="ghost">
        <span className="hidden sm:inline">{copy.share}</span>
      </Button>
      {feedback === "copied" ? (
        <p className="absolute right-0 top-[calc(100%+6px)] z-20 m-0 w-40 rounded-[8px] border border-[color-mix(in_oklab,var(--ok)_32%,var(--line))] bg-background px-2.5 py-2 text-[12px] leading-5 text-[var(--ok)] shadow-studio">
          {copy.shareCopied}
        </p>
      ) : null}
      {feedback === "error" ? (
        <p className="absolute right-0 top-[calc(100%+6px)] z-20 m-0 w-44 rounded-[8px] border border-[color-mix(in_oklab,var(--danger)_32%,var(--line))] bg-background px-2.5 py-2 text-[12px] leading-5 text-[var(--danger)] shadow-studio">
          {copy.shareError}
        </p>
      ) : null}
    </div>
  );
}
