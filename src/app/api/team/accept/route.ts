import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { acceptPendingTeamInvitation } from "@/modules/team/accept-invitation";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accepted = await acceptPendingTeamInvitation({ email: user.email, id: user.id });
  return NextResponse.json({ accepted });
}
