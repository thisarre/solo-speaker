"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
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

  redirect("/dashboard");
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

  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/login?message=${encodeURIComponent("Déconnexion effectuée.")}`);
}
