"use client";

import { Link, Lock, Share2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/client";

type ShareButtonProps = {
  canShare: boolean;
  shareToken: string | null;
  talkId: string;
};

export function ShareButton({ canShare, shareToken, talkId }: ShareButtonProps) {
  const { messages } = useI18n();
  const copy = messages.editor.sharePublic;
  const [localToken, setLocalToken] = useState<string | null>(shareToken);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  if (!canShare) {
    return (
      <Button disabled leftIcon={<Lock />} size="sm" title={copy.locked} type="button" variant="quiet">
        <span className="hidden sm:inline">{messages.editor.share}</span>
      </Button>
    );
  }

  function buildPublicUrl(token: string) {
    return `${window.location.origin}/public/talks/${token}`;
  }

  async function handleOpen() {
    if (localToken) {
      setDialogOpen(true);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/talks/${talkId}/share`, {
        method: "POST",
        credentials: "same-origin"
      });

      const payload = (await response.json()) as { shareToken?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? copy.error);
      if (!payload.shareToken) throw new Error(copy.error);

      setLocalToken(payload.shareToken);
      setDialogOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!localToken) return;
    try {
      await navigator.clipboard.writeText(buildPublicUrl(localToken));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      // Clipboard not available — ignore
    }
  }

  async function handleRevoke() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/talks/${talkId}/share`, {
        method: "DELETE",
        credentials: "same-origin"
      });

      const payload = (await response.json()) as { shareToken?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? copy.error);
      if (!payload.shareToken) throw new Error(copy.error);

      setLocalToken(payload.shareToken);
      setCopied(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button leftIcon={<Share2 />} onClick={handleOpen} disabled={loading} size="sm" type="button" variant="ghost">
        <span className="hidden sm:inline">{loading ? copy.generating : messages.editor.share}</span>
      </Button>
      {error && !dialogOpen ? (
        <p className="absolute right-0 top-[calc(100%+6px)] z-20 w-48 rounded-[8px] border border-[color-mix(in_oklab,var(--danger)_32%,var(--line))] bg-background px-2.5 py-2 text-[12px] leading-5 text-[var(--danger)] shadow-studio">
          {error}
        </p>
      ) : null}

      {dialogOpen && localToken ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[color-mix(in_oklab,var(--ink)_34%,transparent)] p-4 backdrop-blur-sm"
          onMouseDown={() => { if (!loading) setDialogOpen(false); }}
        >
          <section
            aria-modal="true"
            className="w-full max-w-[440px] rounded-[10px] border border-border bg-background shadow-studio"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
          >
            <header className="flex items-start gap-3 border-b border-border px-5 py-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-accent-muted text-accent-ink">
                <Link className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="m-0 text-[16px] font-semibold tracking-[0] text-foreground">{copy.title}</h2>
                <p className="mt-1 text-[13px] leading-5 text-muted">{copy.body}</p>
              </div>
              <button
                className="flex size-7 shrink-0 items-center justify-center rounded-[7px] text-faint hover:bg-panel hover:text-foreground"
                onClick={() => setDialogOpen(false)}
                type="button"
              >
                <X className="size-4" />
              </button>
            </header>

            <div className="px-5 py-4">
              <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[.1em] text-faint">
                {copy.urlLabel}
              </label>
              <div className="flex items-center gap-2">
                <input
                  className="h-9 min-w-0 flex-1 truncate rounded-[8px] border border-border bg-panel px-3 font-mono text-[12px] text-muted outline-none"
                  readOnly
                  value={buildPublicUrl(localToken)}
                />
                <Button disabled={loading} onClick={handleCopy} size="sm" type="button" variant={copied ? "accent" : "ghost"}>
                  {copied ? copy.copied : copy.copy}
                </Button>
              </div>
              {error ? (
                <p className="mt-2 text-[12px] leading-5 text-[var(--danger)]">{error}</p>
              ) : null}
            </div>

            <footer className="flex flex-wrap justify-between gap-2 border-t border-border px-5 py-4">
              <Button disabled={loading} onClick={handleRevoke} size="sm" type="button" variant="quiet">
                {loading ? copy.revoking : copy.revoke}
              </Button>
              <Button disabled={loading} onClick={() => setDialogOpen(false)} size="sm" type="button" variant="ghost">
                {messages.common.cancel}
              </Button>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
