import { createClient } from "@/lib/supabase/server";

export type RehearsalSession = {
  id: string;
  talkId: string | null;
  talkTitle: string | null;
  startedAt: string;
  durationSeconds: number;
  estimatedSeconds: number | null;
};

export async function getRehearsalSessions(): Promise<RehearsalSession[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rehearsal_sessions")
    .select("id, talk_id, talk_title, started_at, duration_seconds, estimated_seconds")
    .order("started_at", { ascending: true })
    .limit(500);

  if (error) return [];

  return (data ?? []).map((row) => ({
    id: row.id,
    talkId: row.talk_id,
    talkTitle: row.talk_title,
    startedAt: row.started_at,
    durationSeconds: row.duration_seconds,
    estimatedSeconds: row.estimated_seconds
  }));
}
