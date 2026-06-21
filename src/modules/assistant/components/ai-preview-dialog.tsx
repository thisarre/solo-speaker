"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AssistantGenerateResult } from "@/modules/assistant/types";

type AiPreviewDialogProps = {
  result: AssistantGenerateResult;
  onAppend: () => void;
  onClose: () => void;
  primaryLabel?: string;
  onReplace?: () => void;
};

export function AiPreviewDialog({ result, onAppend, onClose, onReplace, primaryLabel }: AiPreviewDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_oklab,var(--ink)_34%,transparent)] p-4 backdrop-blur-sm">
      <section className="grid max-h-[86vh] w-full max-w-[720px] grid-rows-[auto_minmax(0,1fr)_auto] rounded-[10px] border border-line bg-bg shadow-[0_24px_80px_rgba(10,10,16,.25)]">
        <header className="flex items-start gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="m-0 text-[16px] font-semibold tracking-[0] text-ink">Preview IA</h2>
            <p className="mt-1 text-[12.5px] leading-5 text-mute">Relis le résultat avant de l&apos;insérer dans le talk.</p>
          </div>
          <Button aria-label="Fermer" onClick={onClose} size="icon" type="button" variant="quiet">
            <X className="size-4" />
          </Button>
        </header>

        <div className="studio-scroll min-h-0 overflow-y-auto px-5 py-4">
          {result.kind === "outline" ? (
            <div className="grid gap-3">
              {result.sections.map((section, index) => (
                <article className="rounded-[8px] border border-line bg-surface p-3" key={`${section.heading}-${index}`}>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-mono text-[10px] text-faint">{index + 1}</span>
                    <h3 className="m-0 text-[14px] font-semibold tracking-[0] text-ink">{section.heading}</h3>
                  </div>
                  <p className="m-0 whitespace-pre-wrap text-[13px] leading-6 text-mute">{section.body}</p>
                </article>
              ))}
            </div>
          ) : result.kind === "bible" ? (
            <article className="rounded-[8px] border border-line bg-surface p-4">
              <h3 className="m-0 text-[15px] font-semibold tracking-[0] text-ink">{result.reference}</h3>
              <p className="m-0 mt-3 whitespace-pre-wrap text-[14px] leading-7 text-mute">{result.text}</p>
              <p className="m-0 mt-3 border-t border-line2 pt-3 text-[13px] leading-6 text-mute">{result.reason}</p>
            </article>
          ) : result.kind === "suggestion" ? (
            <article className="rounded-[8px] border border-line bg-surface p-4">
              <h3 className="m-0 text-[15px] font-semibold tracking-[0] text-ink">Suite proposée</h3>
              <p className="m-0 mt-3 whitespace-pre-wrap text-[14px] leading-7 text-mute">{result.text}</p>
            </article>
          ) : (
            <article className="rounded-[8px] border border-line bg-surface p-4">
              <h3 className="m-0 text-[15px] font-semibold tracking-[0] text-ink">{result.heading || "Section"}</h3>
              <p className="m-0 mt-3 whitespace-pre-wrap text-[14px] leading-7 text-mute">{result.body}</p>
            </article>
          )}
        </div>

        <footer className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-4">
          <Button onClick={onClose} type="button" variant="quiet">Annuler</Button>
          {onReplace ? (
            <Button onClick={onReplace} type="button" variant="ghost">Remplacer</Button>
          ) : null}
          <Button onClick={onAppend} type="button" variant="primary">
            {primaryLabel ?? (result.kind === "outline" ? "Ajouter les sections" : result.kind === "bible" ? "Insérer le verset" : "Ajouter à la suite")}
          </Button>
        </footer>
      </section>
    </div>
  );
}
