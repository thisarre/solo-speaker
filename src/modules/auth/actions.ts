"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TalkType } from "@/types/talk";

const speakerRoles = new Set(["pastor", "conference_speaker", "trainer", "founder", "speaker"]);
const talkTypes = new Set<TalkType>(["sermon", "conference", "training", "pitch", "speech"]);
type SpeakerRole = "pastor" | "conference_speaker" | "trainer" | "founder" | "speaker";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectWithError(path: string, message: string, params?: Record<string, string>): never {
  const query = new URLSearchParams(params);
  query.set("error", message);
  redirect(`${path}?${query.toString()}`);
}

function authErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Email ou mot de passe incorrect.";
  }

  if (normalized.includes("already registered") || normalized.includes("already exists")) {
    return "Un compte existe déjà avec cet email.";
  }

  if (normalized.includes("email not confirmed") || normalized.includes("not confirmed")) {
    return "Confirme ton email avant de te connecter.";
  }

  if (normalized.includes("password")) {
    return "Le mot de passe doit contenir au moins 6 caractères.";
  }

  if (normalized.includes("email")) {
    return "Vérifie l'adresse email renseignée.";
  }

  return message || "Une erreur est survenue. Réessaie dans un instant.";
}

function safeNext(value: string, fallback = "/dashboard") {
  return value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

function isSpeakerRole(value: string): value is SpeakerRole {
  return speakerRoles.has(value);
}

export async function signUp(formData: FormData) {
  const fullName = getString(formData, "name");
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  if (!email || !password) {
    redirectWithError("/signup", "Email et mot de passe requis.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  });

  if (error) {
    redirectWithError("/signup", authErrorMessage(error.message));
  }

  if (!data.session) {
    redirect(`/login?message=${encodeURIComponent("Compte créé. Vérifie ton email si la confirmation est activée.")}`);
  }

  redirect("/onboarding");
}

export async function login(formData: FormData) {
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const next = getString(formData, "next");

  if (!email || !password) {
    redirectWithError("/login", "Email et mot de passe requis.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirectWithError("/login", authErrorMessage(error.message));
  }

  const destination = safeNext(next);
  redirect(`/onboarding?next=${encodeURIComponent(destination)}`);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/login?message=${encodeURIComponent("Déconnexion effectuée.")}`);
}

export async function completeOnboarding(formData: FormData) {
  const next = safeNext(getString(formData, "next"));
  const speakerRole = getString(formData, "speakerRole");
  const primaryTalkType = getString(formData, "primaryTalkType") as TalkType;
  const helpRequested = getString(formData, "helpRequested") === "yes";
  const supportNote = getString(formData, "supportNote").slice(0, 600);

  if (!isSpeakerRole(speakerRole)) {
    redirectWithError("/onboarding", "Choisissez le profil qui vous ressemble le plus.", { next });
  }

  if (!talkTypes.has(primaryTalkType)) {
    redirectWithError("/onboarding", "Choisissez le type de talk que vous préparez le plus souvent.", { next });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login?next=/onboarding");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      speaker_role: speakerRole,
      primary_talk_type: primaryTalkType,
      onboarding_help_requested: helpRequested,
      onboarding_support_note: supportNote,
      onboarding_completed_at: new Date().toISOString()
    })
    .eq("id", user.id);

  if (error) {
    redirectWithError("/onboarding", error.message, { next });
  }

  redirect(next);
}
