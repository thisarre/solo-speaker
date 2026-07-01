import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/modules/billing/capabilities";
import type { BillingPlan } from "@/modules/billing/entitlements";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Session required." }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("billing_plan")
    .eq("id", user.id)
    .maybeSingle();

  const plan = (profile?.billing_plan ?? "trial") as BillingPlan;
  if (!can(plan, "analytics.rehearsal")) {
    return NextResponse.json({ error: "Pro plan required." }, { status: 403 });
  }

  const { data } = await supabase
    .from("rehearsal_sessions")
    .select("id, talk_id, talk_title, started_at, duration_seconds, estimated_seconds")
    .order("started_at", { ascending: false })
    .limit(500);

  return NextResponse.json({ sessions: data ?? [] });
}
