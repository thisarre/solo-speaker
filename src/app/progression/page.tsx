import { AppShell } from "@/components/layout/AppShell";
import { ProgressionPage } from "@/modules/progression/components/progression-page";
import { getTalks } from "@/modules/talks/queries";
import { calculateGlobalProgression } from "@/modules/progression/utils/calculate-global-progression";

export default async function GlobalProgressionPage() {
  const talks = await getTalks();

  return (
    <AppShell>
      <ProgressionPage report={calculateGlobalProgression(talks)} />
    </AppShell>
  );
}
