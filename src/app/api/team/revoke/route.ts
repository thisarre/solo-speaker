import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { invitationId } = await request.json() as { invitationId?: string };
  if (!invitationId) return NextResponse.json({ error: "Missing invitationId" }, { status: 400 });

  const admin = createAdminClient();

  const { data: invitation } = await admin
    .from("team_invitations")
    .select("id, team_id, email, status")
    .eq("id", invitationId)
    .single();

  if (!invitation) return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });

  // Verify requester owns the team
  const { data: team } = await admin.from("teams").select("id").eq("id", invitation.team_id).eq("owner_id", user.id).maybeSingle();
  if (!team) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  // Delete invitation entirely so the email can be re-invited later
  await admin.from("team_invitations").delete().eq("id", invitationId);

  // Remove member from team using getUserByEmail (efficient, no listUsers())
  if (invitation.status === "active") {
    // listUsers with filter is more efficient than fetching all
    const { data: memberList } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const member = memberList?.users.find(u => u.email?.toLowerCase() === invitation.email.toLowerCase());
    if (member) {
      await admin.from("profiles")
        .update({ team_id: null, billing_plan: "trial" })
        .eq("id", member.id);
    }
  }

  return NextResponse.json({ ok: true });
}
