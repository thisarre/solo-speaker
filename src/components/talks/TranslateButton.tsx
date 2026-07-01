"use client";

import { Languages, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/client";
import { localizedPath } from "@/i18n/routing";
import { talkLanguageLabels, type TalkLanguage } from "@/types/talk";

const ALL_LANGUAGES: TalkLanguage[] = ["FR", "EN", "ES", "DE", "IT", "PT"];

type TranslateButtonProps = {
  canTranslate: boolean;
  sourceLang: TalkLanguage;
  talkId: string;
};

export function TranslateButton({ canTranslate, sourceLang, talkId }: TranslateButtonProps) {
  const { locale, messages } = useI18n();
  const copy = messages.editor.translate;
  const router = useRouter();
  const targetLanguages = ALL_LANGUAGES.filter((l) => l !== sourceLang);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [targetLang, setTargetLang] = useState<TalkLanguage>(targetLanguages[0] ?? "EN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!canTranslate) {
    return (
      <Button disabled leftIcon={<Lock />} size="sm" title={copy.locked} type="button" variant="quiet">
        <span className="hidden sm:inline">{copy.label}</span>
      </Button>
    );
  }

  async function handleTranslate() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/talks/${talkId}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ targetLanguage: targetLang })
      });

      let payload: { ok?: boolean; talkId?: string; error?: string } = {};
      try {
        payload = (await response.json()) as typeof payload;
      } catch {
        /* noop */
      }

      if (!response.ok) {
        throw new Error(payload.error || copy.error);
      }

      if (!payload.talkId) throw new Error(copy.error);

      setDialogOpen(false);
      router.push(localizedPath(`/talks/${payload.talkId}`, locale));
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button leftIcon={<Languages />} onClick={() => setDialogOpen(true)} size="sm" type="button" variant="ghost">
        <span className="hidden sm:inline">{copy.label}</span>
      </Button>

      {dialogOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[color-mix(in_oklab,var(--ink)_34%,transparent)] p-4 backdrop-blur-sm"
          onMouseDown={() => { if (!loading) setDialogOpen(false); }}
        >
          <section
            aria-modal="true"
            className="w-full max-w-[400px] rounded-[10px] border border-border bg-background shadow-studio"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
          >
            <header className="flex items-start gap-3 border-b border-border px-5 py-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-accent-muted text-accent-ink">
                <Languages className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="m-0 text-[16px] font-semibold tracking-[0] text-foreground">{copy.title}</h2>
                <p className="mt-1 text-[13px] leading-5 text-muted">{copy.body}</p>
              </div>
            </header>

            <div className="px-5 py-4">
              <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[.1em] text-faint">
                {copy.selectLanguage}
              </label>
              <select
                className="h-9 w-full rounded-[8px] border border-border bg-background px-3 text-[14px] text-foreground outline-none focus:border-accent"
                disabled={loading}
                onChange={(e) => setTargetLang(e.target.value as TalkLanguage)}
                value={targetLang}
              >
                {targetLanguages.map((lang) => (
                  <option key={lang} value={lang}>{talkLanguageLabels[lang]}</option>
                ))}
              </select>
              {error ? (
                <p className="mt-2 text-[12px] leading-5 text-[var(--danger)]">{error}</p>
              ) : null}
            </div>

            <footer className="flex flex-wrap justify-end gap-2 px-5 py-4">
              <Button disabled={loading} onClick={() => setDialogOpen(false)} type="button" variant="quiet">
                {messages.common.cancel}
              </Button>
              <Button disabled={loading} leftIcon={<Languages />} onClick={handleTranslate} type="button" variant="primary">
                {loading ? copy.loading : copy.confirm}
              </Button>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
