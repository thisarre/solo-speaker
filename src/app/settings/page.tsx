import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { getProfile } from "@/modules/auth/queries";
import { AssistantFeatureSettingsPage } from "@/modules/settings/components/assistant-feature-settings-page";

export default async function SettingsPage() {
  const profile = await getProfile();

  return (
    <AppShell>
      <div className="studio-scroll h-screen overflow-y-auto bg-background px-5 pb-28 pt-7 md:px-10 md:py-8">
        <div className="mx-auto w-full max-w-[1180px]">
          <PageHeader
            eyebrow="Réglages"
            title="Réglages du studio"
            description="Ajustez l'assistant, les modules spécialisés et le prompteur pour préparer vos talks avec moins de friction."
          />
          <div className="mt-6">
            <AssistantFeatureSettingsPage profile={profile} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
