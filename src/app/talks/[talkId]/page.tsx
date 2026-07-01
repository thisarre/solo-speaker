import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { TalkEditor } from "@/components/talks/TalkEditor";
import { getTalkById } from "@/modules/talks/queries";
import { can } from "@/modules/billing/capabilities";
import type { BillingPlan } from "@/modules/billing/entitlements";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/modules/auth/queries";
import type { Locale } from "@/i18n/routing";

type TalkPageProps = {
  params: Promise<{ talkId: string }>;
};

export default async function TalkPage({ params }: TalkPageProps) {
  return <TalkPageView params={params} />;
}

export async function TalkPageView({ params, locale }: TalkPageProps & { locale?: Locale }) {
  const { talkId } = await params;
  const [talk, user] = await Promise.all([getTalkById(talkId), getUser()]);

  if (!talk) {
    notFound();
  }

  let canTranslate = false;
  if (user) {
    const supabase = await createClient();
    const { data: profile } = await supabase.from("profiles").select("billing_plan").eq("id", user.id).maybeSingle();
    const plan = (profile?.billing_plan ?? "trial") as BillingPlan;
    canTranslate = can(plan, "talk.multilingual");
  }

  return (
    <AppShell locale={locale}>
      <TalkEditor canTranslate={canTranslate} talk={talk} />
    </AppShell>
  );
}
