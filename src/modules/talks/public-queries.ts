import { createPublicClient } from "@/lib/supabase/public";
import type { Talk } from "@/types/talk";
import { mapTalk, type TalkWithSectionsRow } from "./mappers";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getTalkByShareToken(token: string): Promise<Talk | null> {
  if (!uuidPattern.test(token)) return null;

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("talks")
    .select("*, talk_sections(*)")
    .eq("share_token", token)
    .order("position", { referencedTable: "talk_sections", ascending: true })
    .maybeSingle();

  if (error || !data) return null;
  return mapTalk(data as TalkWithSectionsRow);
}
