import { AppShell } from "@/components/layout/AppShell";
import { ModularDashboard } from "@/modules/studio-layout/components/modular-dashboard";
import { getTalks } from "@/modules/talks/queries";

export default async function DashboardPage() {
  const talks = await getTalks();

  return (
    <AppShell>
      <ModularDashboard talks={talks} />
    </AppShell>
  );
}
