"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Clock3,
  Mic2,
  Plus,
  Save,
  Trash2
} from "lucide-react";
import { deleteTalk, createTalkSection, deleteTalkSection, reorderTalkSections, updateTalk, updateTalkSection } from "@/modules/talks/actions";
import { formatDuration, sectionSeconds } from "@/lib/utils";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AutosaveStatus, type AutosaveState } from "@/components/talks/AutosaveStatus";
import { AssistantPlaceholderPanel } from "@/modules/assistant/components/assistant-placeholder-panel";
import { talkStatusLabels, talkTypeLabels, type Talk, type TalkSection, type TalkStatus, type TalkType } from "@/types/talk";

type EditableSection = TalkSection & {
  pending?: boolean;
};

type TalkDraft = {
  title: string;
  type: TalkType;
  status: TalkStatus;
  audience: string;
  language: "FR" | "EN";
  sections: EditableSection[];
};

const talkTypes = Object.keys(talkTypeLabels) as TalkType[];
const talkStatuses = Object.keys(talkStatusLabels) as TalkStatus[];
const languages = ["FR", "EN"] as const;

function toDraft(talk: Talk): TalkDraft {
  return {
    title: talk.title,
    type: talk.type,
    status: talk.status,
    audience: talk.audience,
    language: talk.language,
    sections: talk.sections
  };
}

function estimateTotalSeconds(sections: TalkDraft["sections"]) {
  return sections.reduce((total, section) => total + sectionSeconds(section.heading, section.body), 0);
}

export function TalkEditor({ talk }: { talk: Talk }) {
  const [draft, setDraft] = useState<TalkDraft>(() => toDraft(talk));
  const [status, setStatus] = useState<AutosaveState>("idle");
  const [error, setError] = useState("");
  const [activeSectionId, setActiveSectionId] = useState(() => talk.sections[0]?.id ?? "");
  const [deleteTalkRequested, setDeleteTalkRequested] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<EditableSection | null>(null);
  const [isPending, startTransition] = useTransition();
  const lastSavedRef = useRef(JSON.stringify(toDraft(talk)));
  const hydratedRef = useRef(false);

  const totalSeconds = useMemo(() => estimateTotalSeconds(draft.sections), [draft.sections]);
  const durationMinutes = Math.max(1, Math.ceil(totalSeconds / 60));
  const activeSection = draft.sections.find((section) => section.id === activeSectionId) ?? draft.sections[0];

  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }

    const serialized = JSON.stringify(draft);
    if (serialized === lastSavedRef.current) {
      return;
    }

    setStatus("dirty");
    setError("");

    const timeoutId = window.setTimeout(async () => {
      setStatus("saving");

      try {
        await updateTalk({
          id: talk.id,
          title: draft.title,
          type: draft.type,
          status: draft.status,
          audience: draft.audience,
          durationMinutes,
          language: draft.language
        });

        await Promise.all(
          draft.sections
            .filter((section) => !section.pending)
            .map((section) =>
              updateTalkSection({
                id: section.id,
                talkId: talk.id,
                heading: section.heading,
                body: section.body
              })
            )
        );

        lastSavedRef.current = JSON.stringify(draft);
        setStatus("saved");
      } catch (saveError) {
        setStatus("error");
        setError(saveError instanceof Error ? saveError.message : "Impossible de sauvegarder.");
      }
    }, 850);

    return () => window.clearTimeout(timeoutId);
  }, [draft, durationMinutes, talk.id]);

  function updateSection(sectionId: string, values: Partial<EditableSection>) {
    setDraft((current) => ({
      ...current,
      sections: current.sections.map((section) => (section.id === sectionId ? { ...section, ...values } : section))
    }));
  }

  function addSection() {
    const tempId = `pending-${Date.now()}`;
    setDraft((current) => ({
      ...current,
      sections: [
        ...current.sections,
        {
          id: tempId,
          heading: "Nouvelle section",
          body: "",
          position: current.sections.length,
          pending: true
        }
      ]
    }));
    setActiveSectionId(tempId);

    startTransition(async () => {
      try {
        const section = await createTalkSection(talk.id);
        setDraft((current) => {
          const next = {
            ...current,
            sections: current.sections.map((item) => (item.id === tempId ? section : item))
          };
          lastSavedRef.current = JSON.stringify(next);
          return next;
        });
        setActiveSectionId(section.id);
        setStatus("saved");
      } catch (sectionError) {
        setDraft((current) => ({
          ...current,
          sections: current.sections.filter((section) => section.id !== tempId)
        }));
        setStatus("error");
        setError(sectionError instanceof Error ? sectionError.message : "Impossible d'ajouter la section.");
      }
    });
  }

  function removeSection(sectionId: string) {
    const previous = draft.sections;
    const nextSections = previous.filter((section) => section.id !== sectionId).map((section, position) => ({ ...section, position }));
    setDraft((current) => ({ ...current, sections: nextSections }));

    startTransition(async () => {
      try {
        await deleteTalkSection(sectionId, talk.id);
        lastSavedRef.current = JSON.stringify({ ...draft, sections: nextSections });
        setStatus("saved");
      } catch (sectionError) {
        setDraft((current) => ({ ...current, sections: previous }));
        setStatus("error");
        setError(sectionError instanceof Error ? sectionError.message : "Impossible de supprimer la section.");
      }
    });
  }

  function moveSection(sectionId: string, direction: -1 | 1) {
    const index = draft.sections.findIndex((section) => section.id === sectionId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= draft.sections.length) return;

    const nextSections = [...draft.sections];
    const [moved] = nextSections.splice(index, 1);
    nextSections.splice(targetIndex, 0, moved);
    const positioned = nextSections.map((section, position) => ({ ...section, position }));
    setDraft((current) => ({ ...current, sections: positioned }));

    startTransition(async () => {
      try {
        await reorderTalkSections(talk.id, positioned.filter((section) => !section.pending).map((section) => section.id));
        lastSavedRef.current = JSON.stringify({ ...draft, sections: positioned });
        setStatus("saved");
      } catch (sectionError) {
        setStatus("error");
        setError(sectionError instanceof Error ? sectionError.message : "Impossible de réordonner les sections.");
      }
    });
  }

  return (
    <div className="flex h-screen min-w-0 flex-col bg-background text-foreground">
      <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-border bg-background px-4">
        <Link href="/talks">
          <Button aria-label="Retour" size="icon" variant="quiet">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex min-w-0 items-center gap-2 text-[13px] text-muted">
          <span>Talks</span>
          <span className="text-faint">/</span>
          <b className="truncate font-[550] text-foreground">{draft.title || "Sans titre"}</b>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-[8px] border border-border bg-surface px-2.5 py-1.5 font-mono text-[10.5px] text-faint md:flex">
            <Clock3 className="size-3.5" />
            <span>{formatDuration(totalSeconds)}</span>
          </div>
          <AutosaveStatus state={isPending && status !== "saving" ? "saving" : status} />
          <Link href={`/talks/${talk.id}/speak`}>
            <Button leftIcon={<Mic2 />} size="sm" type="button" variant="primary">Présenter</Button>
          </Link>
          <Button aria-label="Supprimer" onClick={() => setDeleteTalkRequested(true)} size="icon" type="button" variant="quiet">
            <Trash2 className="size-4" />
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[220px] shrink-0 border-r border-border bg-background px-2.5 py-5 lg:block">
          <div className="mb-2 flex items-center justify-between px-2.5">
            <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">Plan</p>
            <span className="font-mono text-[10px] text-faint">{draft.sections.length}</span>
          </div>
          <div className="grid gap-0.5">
            {draft.sections.map((section, index) => (
              <a
                className={`grid grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-2 rounded-[7px] px-2.5 py-2 text-[12.5px] transition hover:bg-panel hover:text-foreground ${
                  section.id === activeSection?.id ? "bg-panel font-[550] text-foreground" : "text-muted"
                }`}
                href={`#${section.id}`}
                key={section.id}
                onClick={() => setActiveSectionId(section.id)}
              >
                <span className={`w-4 font-mono text-[10px] ${section.id === activeSection?.id ? "text-accent-ink" : "text-faint"}`}>{index + 1}</span>
                <span className="truncate">{section.heading || "Sans titre"}</span>
                <span className="font-mono text-[10px] text-faint">{formatDuration(sectionSeconds(section.heading, section.body))}</span>
              </a>
            ))}
          </div>
          <button className="mt-3 flex w-full items-center gap-2 rounded-[7px] px-2.5 py-2 text-[12.5px] font-[550] text-muted transition hover:bg-panel hover:text-foreground" onClick={addSection} type="button">
            <Plus className="size-3.5" />
            Section
          </button>
          <div className="mt-3 grid gap-1 border-t border-line2 px-2.5 pt-3 font-mono text-[10.5px] text-faint">
            <div className="flex justify-between gap-2">
              <span>Total estimé</span>
              <span>{formatDuration(totalSeconds)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Objectif</span>
              <span>{durationMinutes} min</span>
            </div>
          </div>
        </aside>

        <main className="studio-scroll min-w-0 flex-1 overflow-y-auto bg-background">
          <div className="mx-auto flex w-full max-w-[1180px] gap-5 px-5 pb-28 pt-7 md:px-8">
            <article className="min-w-0 flex-1">
              <div className="mb-5 xl:hidden">
                <AssistantPlaceholderPanel activeSectionTitle={activeSection?.heading} />
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                <Badge tone="accent">{talkTypeLabels[draft.type]}</Badge>
                <Badge>{durationMinutes} min</Badge>
                {draft.audience ? <Badge>{draft.audience}</Badge> : null}
              </div>

              <div className="mb-5 grid gap-3 rounded-[12px] border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(20,20,25,.03)]">
                <input
                  className="studio-title-input w-full bg-transparent font-semibold leading-[1.15] tracking-[0] text-foreground outline-none placeholder:text-faint"
                  onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Titre du talk"
                  value={draft.title}
                />
                <div className="grid gap-2.5 md:grid-cols-[1fr_132px_132px_84px]">
                  <input
                    className="studio-input h-9 rounded-[8px] border border-border bg-background px-3 text-foreground outline-none placeholder:text-faint focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_16%,transparent)]"
                    onChange={(event) => setDraft((current) => ({ ...current, audience: event.target.value }))}
                    placeholder="Audience"
                    value={draft.audience}
                  />
                  <select className="studio-input h-9 rounded-[8px] border border-border bg-background px-3 text-foreground outline-none focus:border-accent" onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as TalkType }))} value={draft.type}>
                    {talkTypes.map((type) => (
                      <option key={type} value={type}>{talkTypeLabels[type]}</option>
                    ))}
                  </select>
                  <select className="studio-input h-9 rounded-[8px] border border-border bg-background px-3 text-foreground outline-none focus:border-accent" onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as TalkStatus }))} value={draft.status}>
                    {talkStatuses.map((item) => (
                      <option key={item} value={item}>{talkStatusLabels[item]}</option>
                    ))}
                  </select>
                  <select className="studio-input h-9 rounded-[8px] border border-border bg-background px-3 text-foreground outline-none focus:border-accent" onChange={(event) => setDraft((current) => ({ ...current, language: event.target.value as "FR" | "EN" }))} value={draft.language}>
                    {languages.map((language) => (
                      <option key={language} value={language}>{language}</option>
                    ))}
                  </select>
                </div>
                {error ? <Alert>{error}</Alert> : null}
              </div>

            {draft.sections.length ? (
              <div className="grid gap-3">
                {draft.sections.map((section, index) => (
                  <section
                    className={`rounded-[12px] border bg-surface p-4 shadow-[0_1px_2px_rgba(20,20,25,.03)] transition ${
                      section.pending ? "opacity-70" : ""
                    } ${section.id === activeSection?.id ? "border-accent bg-[color-mix(in_oklab,var(--accent)_3%,var(--surface))]" : "border-border"
                    }`}
                    id={section.id}
                    key={section.id}
                    onFocusCapture={() => setActiveSectionId(section.id)}
                    onPointerDown={() => setActiveSectionId(section.id)}
                  >
                    <div className="mb-2.5 flex items-center gap-2.5">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-[6px] bg-panel font-mono text-[10.5px] text-faint">{index + 1}</span>
                      <input
                        className="h-8 min-w-0 flex-1 bg-transparent text-[15px] font-semibold tracking-[0] text-foreground outline-none placeholder:text-faint"
                        onChange={(event) => updateSection(section.id, { heading: event.target.value })}
                        placeholder="Titre de section"
                        value={section.heading}
                      />
                      <span className="hidden font-mono text-[10.5px] text-faint sm:inline">{formatDuration(sectionSeconds(section.heading, section.body))}</span>
                      <Button aria-label="Monter" disabled={index === 0 || section.pending} onClick={() => moveSection(section.id, -1)} size="icon" type="button" variant="quiet">
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button aria-label="Descendre" disabled={index === draft.sections.length - 1 || section.pending} onClick={() => moveSection(section.id, 1)} size="icon" type="button" variant="quiet">
                        <ArrowDown className="size-4" />
                      </Button>
                      <Button aria-label="Supprimer la section" disabled={section.pending} onClick={() => setSectionToDelete(section)} size="icon" type="button" variant="quiet">
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    <textarea
                      className="studio-textarea min-h-36 w-full resize-y rounded-[9px] border border-border bg-background px-3 py-2.5 leading-7 text-foreground outline-none placeholder:text-faint focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_16%,transparent)]"
                      onChange={(event) => updateSection(section.id, { body: event.target.value })}
                      placeholder="Écris le contenu de cette section..."
                      value={section.body}
                    />
                  </section>
                ))}
              </div>
            ) : (
              <div className="rounded-[12px] border border-dashed border-border bg-panel px-5 py-10 text-center">
                <p className="m-0 text-[15px] font-semibold text-foreground">Aucune section</p>
                <p className="mx-auto mb-4 mt-1 max-w-sm text-[13px] leading-6 text-muted">Ajoute une première section pour structurer ce talk.</p>
                <Button leftIcon={<Plus />} onClick={addSection} type="button" variant="primary">Ajouter une section</Button>
              </div>
            )}

            <div className="sticky bottom-4 mt-6 flex justify-end">
              <div className="flex items-center gap-2 rounded-[10px] border border-border bg-surface px-3 py-2 shadow-studio">
                <Save className="size-4 text-faint" />
                <span className="font-mono text-[10.5px] text-faint">{durationMinutes} min</span>
                <AutosaveStatus state={status} />
              </div>
            </div>
            </article>

            <aside className="hidden w-[286px] shrink-0 xl:block">
              <div className="sticky top-0">
                <AssistantPlaceholderPanel activeSectionTitle={activeSection?.heading} />
              </div>
            </aside>
          </div>
        </main>
      </div>
      {deleteTalkRequested ? (
        <ConfirmDialog
          body="Cette action supprimera le talk et toutes ses sections. Elle ne peut pas être annulée."
          confirm={
            <form action={() => deleteTalk(talk.id)}>
              <Button leftIcon={<Trash2 />} type="submit" variant="primary">Supprimer</Button>
            </form>
          }
          onClose={() => setDeleteTalkRequested(false)}
          title="Supprimer ce talk ?"
        />
      ) : null}
      {sectionToDelete ? (
        <ConfirmDialog
          body={`La section "${sectionToDelete.heading || "Sans titre"}" sera retirée du talk.`}
          confirm={
            <Button
              leftIcon={<Trash2 />}
              onClick={() => {
                removeSection(sectionToDelete.id);
                setSectionToDelete(null);
              }}
              type="button"
              variant="primary"
            >
              Supprimer
            </Button>
          }
          onClose={() => setSectionToDelete(null)}
          title="Supprimer cette section ?"
        />
      ) : null}
    </div>
  );
}
