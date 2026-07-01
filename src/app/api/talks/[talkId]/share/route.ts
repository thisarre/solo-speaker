import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/modules/auth/queries";
import { can } from "@/modules/billing/capabilities";
import type { BillingPlan } from "@/modules/billing/entitlements";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function resolveAuthorizedTalkAndPlan(talkId: string) {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();

  const [{ data: profile }, { data: talk }] = await Promise.all([
    supabase.from("profiles").select("billing_plan").eq("id", user.id).maybeSingle(),
    supabase.from("talks").select("id, share_token").eq("id", talkId).eq("user_id", user.id).maybeSingle()
  ]);

  const plan = (profile?.billing_plan ?? "trial") as BillingPlan;
  return { user, supabase, plan, talk };
}

// POST  → generate (or return existing) share_token
export async function POST(_request: Request, { params }: { params: Promise<{ talkId: string }> }) {
  const { talkId } = await params;
  const ctx = await resolveAuthorizedTalkAndPlan(talkId);

  if (!ctx) return errorResponse("Unauthorized", 401);
  if (!can(ctx.plan, "share.public")) return errorResponse("Cette fonctionnalité nécessite le plan Pro.", 403);
  if (!ctx.talk) return errorResponse("Not found", 404);

  if (ctx.talk.share_token) {
    return NextResponse.json({ shareToken: ctx.talk.share_token });
  }

  const { data: updated, error } = await ctx.supabase
    .from("talks")
    .update({ share_token: crypto.randomUUID() })
    .eq("id", talkId)
    .eq("user_id", ctx.user.id)
    .select("share_token")
    .maybeSingle();

  if (error || !updated?.share_token) return errorResponse("Failed to generate share link", 500);
  return NextResponse.json({ shareToken: updated.share_token });
}

// DELETE → revoke: regenerate token so old URL returns 404
export async function DELETE(_request: Request, { params }: { params: Promise<{ talkId: string }> }) {
  const { talkId } = await params;
  const ctx = await resolveAuthorizedTalkAndPlan(talkId);

  if (!ctx) return errorResponse("Unauthorized", 401);
  if (!can(ctx.plan, "share.public")) return errorResponse("Cette fonctionnalité nécessite le plan Pro.", 403);
  if (!ctx.talk) return errorResponse("Not found", 404);

  const { data: updated, error } = await ctx.supabase
    .from("talks")
    .update({ share_token: crypto.randomUUID() })
    .eq("id", talkId)
    .eq("user_id", ctx.user.id)
    .select("share_token")
    .maybeSingle();

  if (error || !updated?.share_token) return errorResponse("Failed to revoke share link", 500);
  return NextResponse.json({ shareToken: updated.share_token });
}
