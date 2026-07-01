import type { Database } from "@/lib/supabase/database.types";
import type { Talk, TalkSection } from "@/types/talk";

type TalkRow = Database["public"]["Tables"]["talks"]["Row"];
type SectionRow = Database["public"]["Tables"]["talk_sections"]["Row"];

export type TalkWithSectionsRow = TalkRow & {
  talk_sections: SectionRow[] | null;
};

function updatedAtLabel(updatedAt: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(updatedAt));
}

export function mapSection(row: SectionRow): TalkSection {
  return {
    id: row.id,
    heading: row.heading,
    body: row.body,
    position: row.position
  };
}

export function mapTalk(row: TalkWithSectionsRow): Talk {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    status: row.status,
    audience: row.audience,
    durationMinutes: row.duration_minutes,
    language: row.language,
    updatedAtLabel: updatedAtLabel(row.updated_at),
    sections: [...(row.talk_sections ?? [])].sort((a, b) => a.position - b.position).map(mapSection),
    parentTalkId: row.parent_talk_id ?? null
  };
}
