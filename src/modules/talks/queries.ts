import { createClient } from "@/lib/supabase/server";
import { getUser, requireUser } from "@/modules/auth/queries";
import { mapTalk, type TalkWithSectionsRow } from "./mappers";

const talkSelect = "*, talk_sections(*)";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getTalks() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("talks")
    .select(talkSelect)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .order("position", { referencedTable: "talk_sections", ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data as TalkWithSectionsRow[]).map(mapTalk);
}

export async function getTalkById(talkId: string) {
  if (!uuidPattern.test(talkId)) {
    return null;
  }

  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("talks")
    .select(talkSelect)
    .eq("id", talkId)
    .eq("user_id", user.id)
    .order("position", { referencedTable: "talk_sections", ascending: true })
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapTalk(data as TalkWithSectionsRow) : null;
}

export const getTalk = getTalkById;

export async function getTalkCount() {
  const user = await getUser();
  if (!user) return 0;

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("talks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (error) return 0;
  return count ?? 0;
}
