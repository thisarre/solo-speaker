import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getMessages } from "@/i18n/messages";
import { resolveServerLocale } from "@/i18n/server";

type JoinCopy = ReturnType<typeof getMessages>["join"];

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const locale = resolveServerLocale((await headers()).get("x-locale"));
  const copy = getMessages(locale).join;

  const { token } = await searchParams;
  if (!token) return <JoinError copy={copy} message={copy.missingToken} />;

  const admin = createAdminClient();

  let invitation: { id: string; team_id: string; email: string; status: string } | null = null;
  let loadError: string | null = null;
  try {
    const { data, error } = await admin
      .from("team_invitations")
      .select("id, team_id, email, status")
      .eq("token", token)
      .maybeSingle();

    if (error) loadError = `${copy.dbErrorPrefix}${error.message}`;
    else invitation = data;
  } catch (e) {
    loadError = `${copy.unexpectedErrorPrefix}${String(e)}`;
  }

  if (loadError) return <JoinError copy={copy} message={loadError} />;
  if (!invitation) return <JoinError copy={copy} message={copy.notFound} />;
  if (invitation.status !== "pending") {
    return <JoinError copy={copy} message={invitation.status === "active" ? copy.alreadyAccepted : copy.alreadyRevoked} />;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/join?token=${token}`)}`);
  }

  if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
    return (
      <JoinError
        copy={copy}
        message={copy.wrongAccount.replace("{intended}", invitation.email).replace("{current}", user.email ?? "")}
      />
    );
  }

  await Promise.all([
    admin.from("profiles").update({ team_id: invitation.team_id, billing_plan: "studio" }).eq("id", user.id),
    admin.from("team_invitations").update({ status: "active", accepted_at: new Date().toISOString() }).eq("id", invitation.id)
  ]);

  redirect("/dashboard");
}

function JoinError({ copy, message }: { copy: JoinCopy; message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center">
      <p className="text-[15px] font-[550] text-foreground">{copy.title}</p>
      <p className="max-w-sm text-[13px] text-faint">{message}</p>
      <Link className="text-[13px] text-accent underline" href="/dashboard">{copy.back}</Link>
    </div>
  );
}
