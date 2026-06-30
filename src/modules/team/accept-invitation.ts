import { createAdminClient } from "@/lib/supabase/admin";

// Adds the signed-in user to a team when a pending invitation matches their email. Idempotent and
// safe to call on every authenticated entry (signup, login, /auth/confirm) — so an invited person
// gets in as soon as they sign in with the invited address, whether or not the email was delivered.
// Uses the service role because billing_plan / team_id are service-role-only writes.
export async function acceptPendingTeamInvitation(user: { id: string; email?: string | null }): Promise<boolean> {
  const email = user.email?.toLowerCase();
  if (!email) return false;

  const admin = createAdminClient();

  const { data: invitation } = await admin
    .from("team_invitations")
    .select("id, team_id")
    .eq("email", email)
    .eq("status", "pending")
    .maybeSingle();

  if (!invitation) return false;

  await Promise.all([
    admin.from("profiles").update({ team_id: invitation.team_id, billing_plan: "team" }).eq("id", user.id),
    admin.from("team_invitations").update({ status: "active", accepted_at: new Date().toISOString() }).eq("id", invitation.id)
  ]);

  return true;
}
