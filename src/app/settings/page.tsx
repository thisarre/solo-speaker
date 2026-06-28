import { headers } from "next/headers";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { getProfile } from "@/modules/auth/queries";
import { AssistantFeatureSettingsPage } from "@/modules/settings/components/assistant-feature-settings-page";
import { TeamSettings } from "@/modules/team/components/team-settings";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/i18n/routing";
import { resolveServerLocale } from "@/i18n/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function SettingsPage() {
  return <SettingsPageView />;
}

export async function SettingsPageView({ locale: routeLocale }: { locale?: Locale } = {}) {
  const profile = await getProfile();
  const locale = resolveServerLocale((await headers()).get("x-locale"), routeLocale);
  const settings = getMessages(locale).settings;

  type TeamInvitation = { id: string; email: string; status: "pending" | "active" | "revoked"; invited_at: string; accepted_at: string | null };
  type TeamData = { id: string; max_seats: number; invitations: TeamInvitation[] };

  let teamData: TeamData | null = null;
  if (profile?.billing_plan === "team") {
    const admin = createAdminClient();
    const { data: team } = await admin.from("teams").select("id, max_seats").eq("owner_id", profile.id).maybeSingle();
    if (team) {
      const { data: invitations } = await admin.from("team_invitations").select("id, email, status, invited_at, accepted_at").eq("team_id", team.id).neq("status", "revoked");
      teamData = { id: team.id, max_seats: team.max_seats, invitations: (invitations ?? []) as TeamInvitation[] };
    }
  }

  return (
    <AppShell locale={locale}>
      <div className="studio-scroll h-[100svh] overflow-y-auto bg-background px-5 pb-28 pt-7 md:px-10 md:py-8">
        <div className="mx-auto w-full max-w-[1480px]">
          <PageHeader
            eyebrow={settings.title}
            title={settings.studioTitle}
            description={settings.description}
          />
          <div className="mt-6 space-y-8">
            {teamData ? (
              <div className="rounded-[16px] border border-border bg-panel p-6">
                <TeamSettings
                  teamId={teamData.id}
                  maxSeats={teamData.max_seats}
                  invitations={teamData.invitations}
                />
              </div>
            ) : null}
            <AssistantFeatureSettingsPage profile={profile} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
