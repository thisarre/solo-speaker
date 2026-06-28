"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/modules/auth/queries";
import { canCreateTalk, type BillingPlan } from "@/modules/billing/entitlements";
import { getPostHogClient } from "@/lib/posthog-server";
import { getMessages } from "@/i18n/messages";
import { localizedPath } from "@/i18n/routing";
import { resolveServerLocale } from "@/i18n/server";
import type { TalkStatus, TalkType } from "@/types/talk";

const copy = getMessages("fr");
const talkTypes = new Set<TalkType>(["sermon", "conference", "training", "pitch", "speech"]);
const talkStatuses = new Set<TalkStatus>(["draft", "ready", "archived"]);
const languages = new Set(["FR", "EN"]);

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function assertOwnTalk(talkId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("talks")
    .select("id")
    .eq("id", talkId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(copy.errors.talkNotFound);
  }

  return { user, supabase };
}

export async function createTalk(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  const locale = resolveServerLocale((await headers()).get("x-locale"));

  const title = getString(formData, "title");
  const typeValue = getString(formData, "type") as TalkType;
  const audience = getString(formData, "audience");
  const brief = getString(formData, "brief");

  if (!title || !talkTypes.has(typeValue)) {
    redirect(localizedPath(`/talks/new?error=${encodeURIComponent(copy.errors.titleAndTypeRequired)}`, locale));
  }

  const [{ count, error: countError }, { data: profileData }] = await Promise.all([
    supabase.from("talks").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("profiles").select("billing_plan").eq("id", user.id).maybeSingle()
  ]);

  if (countError) {
    redirect(localizedPath(`/talks/new?error=${encodeURIComponent(countError.message)}`, locale));
  }

  const billingPlan = (profileData?.billing_plan ?? "trial") as BillingPlan;
  const entitlement = canCreateTalk({ currentTalkCount: count ?? 0, plan: billingPlan });
  if (!entitlement.allowed) {
    redirect(localizedPath(`/pricing?error=${encodeURIComponent(entitlement.reason)}`, locale));
  }

  const { data: talk, error } = await supabase
    .from("talks")
    .insert({
      user_id: user.id,
      title,
      type: typeValue,
      audience,
      duration_minutes: 10,
      language: "FR"
    })
    .select("id")
    .single();

  if (error) {
    redirect(localizedPath(`/talks/new?error=${encodeURIComponent(error.message)}`, locale));
  }

  const sections = brief
    ? [{ talk_id: talk.id, heading: "Brief", body: brief, position: 0 }]
    : [{ talk_id: talk.id, heading: "Accroche", body: "", position: 0 }];

  const { error: sectionError } = await supabase.from("talk_sections").insert(sections);

  if (sectionError) {
    redirect(localizedPath(`/talks/new?error=${encodeURIComponent(sectionError.message)}`, locale));
  }

  getPostHogClient().capture({
    distinctId: user.id,
    event: "talk_created",
    properties: { talk_type: typeValue, has_audience: Boolean(audience), has_brief: Boolean(brief) }
  });

  revalidatePath("/dashboard");
  revalidatePath("/talks");
  redirect(localizedPath(`/talks/${talk.id}`, locale));
}

export async function updateTalk(input: {
  id: string;
  title: string;
  type: TalkType;
  status: TalkStatus;
  audience: string;
  durationMinutes: number;
  language: "FR" | "EN";
}) {
  const { user, supabase } = await assertOwnTalk(input.id);
  const title = cleanText(input.title);
  const type = input.type;
  const status = input.status;
  const language = input.language;
  const durationMinutes = Math.max(1, Math.round(Number(input.durationMinutes) || 1));

  if (!title) {
    throw new Error(copy.errors.titleRequired);
  }

  if (!talkTypes.has(type) || !talkStatuses.has(status) || !languages.has(language)) {
    throw new Error(copy.errors.invalidTalkValue);
  }

  const { error } = await supabase
    .from("talks")
    .update({
      title,
      type,
      status,
      audience: cleanText(input.audience),
      duration_minutes: durationMinutes,
      language,
      updated_at: new Date().toISOString()
    })
    .eq("id", input.id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/talks");
  revalidatePath(`/talks/${input.id}`);
}

export async function deleteTalk(talkId: string) {
  const { user, supabase } = await assertOwnTalk(talkId);
  const locale = resolveServerLocale((await headers()).get("x-locale"));

  const { error } = await supabase.from("talks").delete().eq("id", talkId).eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  getPostHogClient().capture({
    distinctId: user.id,
    event: "talk_deleted"
  });

  revalidatePath("/dashboard");
  revalidatePath("/talks");
  redirect(localizedPath("/talks", locale));
}

export async function createTalkSection(talkId: string) {
  const { supabase } = await assertOwnTalk(talkId);

  const { count, error: countError } = await supabase
    .from("talk_sections")
    .select("id", { count: "exact", head: true })
    .eq("talk_id", talkId);

  if (countError) {
    throw new Error(countError.message);
  }

  const { data, error } = await supabase
    .from("talk_sections")
    .insert({
      talk_id: talkId,
      heading: copy.editor.newSectionTitle,
      body: "",
      position: count ?? 0
    })
    .select("id, heading, body, position")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/talks/${talkId}`);
  revalidatePath("/talks");
  return data;
}

export async function updateTalkSection(input: {
  id: string;
  talkId: string;
  heading: string;
  body: string;
}) {
  const { supabase } = await assertOwnTalk(input.talkId);
  const heading = cleanText(input.heading) || copy.editor.untitled;

  const { error } = await supabase
    .from("talk_sections")
    .update({
      heading,
      body: typeof input.body === "string" ? input.body : "",
      updated_at: new Date().toISOString()
    })
    .eq("id", input.id)
    .eq("talk_id", input.talkId);

  if (error) {
    throw new Error(error.message);
  }

  await supabase.from("talks").update({ updated_at: new Date().toISOString() }).eq("id", input.talkId);
  revalidatePath(`/talks/${input.talkId}`);
  revalidatePath("/talks");
}

export async function deleteTalkSection(sectionId: string, talkId: string) {
  const { supabase } = await assertOwnTalk(talkId);

  const { error } = await supabase.from("talk_sections").delete().eq("id", sectionId).eq("talk_id", talkId);

  if (error) {
    throw new Error(error.message);
  }

  const { data: sections, error: listError } = await supabase
    .from("talk_sections")
    .select("id")
    .eq("talk_id", talkId)
    .order("position", { ascending: true });

  if (listError) {
    throw new Error(listError.message);
  }

  await reorderTalkSections(talkId, (sections ?? []).map((section) => section.id));
}

export async function reorderTalkSections(talkId: string, sectionIds: string[]) {
  const { supabase } = await assertOwnTalk(talkId);

  for (const [position, id] of sectionIds.entries()) {
    const { error } = await supabase
      .from("talk_sections")
      .update({ position, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("talk_id", talkId);

    if (error) {
      throw new Error(error.message);
    }
  }

  await supabase.from("talks").update({ updated_at: new Date().toISOString() }).eq("id", talkId);
  revalidatePath(`/talks/${talkId}`);
  revalidatePath("/talks");
}
