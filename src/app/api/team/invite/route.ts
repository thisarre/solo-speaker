import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/modules/landing/seo";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email } = await request.json() as { email?: string };
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Cannot invite yourself
  if (normalizedEmail === user.email?.toLowerCase()) {
    return NextResponse.json({ error: "Vous ne pouvez pas vous inviter vous-même" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: team } = await admin.from("teams").select("id, max_seats").eq("owner_id", user.id).maybeSingle();
  if (!team) return NextResponse.json({ error: "Aucune équipe trouvée" }, { status: 404 });

  const { count: activeCount } = await admin
    .from("team_invitations")
    .select("id", { count: "exact", head: true })
    .eq("team_id", team.id)
    .in("status", ["pending", "active"]);

  if ((activeCount ?? 0) >= team.max_seats - 1) {
    return NextResponse.json({ error: "Limite de sièges atteinte" }, { status: 400 });
  }

  const { data: invitation, error } = await admin
    .from("team_invitations")
    .upsert({ team_id: team.id, email: normalizedEmail, status: "pending" }, { onConflict: "team_id,email" })
    .select("id, token")
    .single();

  if (error || !invitation) {
    return NextResponse.json({ error: "Erreur lors de l'invitation" }, { status: 500 });
  }

  // Single source of truth for the site URL (configured via NEXT_PUBLIC_SITE_URL) — never the Origin header.
  const joinPath = `/join?token=${invitation.token}`;
  // Supabase invite emails use implicit flow (hash fragment).
  // /auth/confirm handles the hash client-side, finds the invitation by email,
  // and redirects to /join?token=xxx.
  const redirectTo = `${siteUrl}/auth/confirm`;

  // Try invite (new users) first, fall back to magic link (existing users)
  let emailSent = false;
  let emailError: string | null = null;

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(normalizedEmail, { redirectTo });

  if (inviteError) {
    // User already exists — inviteUserByEmail can't target them. Send a real magic-link email
    // (generateLink only *builds* a link, it never sends). When they log in, auto-accept adds them
    // to the team. If SMTP isn't configured the send fails here and emailSent stays false, so the UI
    // falls back to the copyable join link.
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { emailRedirectTo: redirectTo, shouldCreateUser: false }
    });
    emailSent = !otpError;
    emailError = otpError?.message ?? null;
  } else {
    emailSent = true;
  }

  return NextResponse.json({
    id: invitation.id,
    joinUrl: `${siteUrl}${joinPath}`,
    emailSent,
    emailError,
  });
}
