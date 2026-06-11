import { Sidebar } from "./Sidebar";
import type { ReactNode } from "react";
import { getProfile } from "@/modules/auth/queries";
import { getTalkCount } from "@/modules/talks/queries";

export async function AppShell({ children }: { children: ReactNode }) {
  const [profile, talkCount] = await Promise.all([getProfile(), getTalkCount()]);

  return (
    <div className="flex min-h-screen bg-bg text-ink">
      <Sidebar talkCount={talkCount} userName={profile?.full_name ?? "Speaker"} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
