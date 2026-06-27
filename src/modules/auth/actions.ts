"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getPostHogClient } from "@/lib/posthog-server";
import { getMessages } from "@/i18n/messages";
import { isLocale, localizedPath } from "@/i18n/routing";
import { authErrorMessage, buildOAuthRedirectTo, buildPasswordRecoveryRedirectTo, firstLoginDestination, passwordValidationError, safeNext } from "./security";
import { getCheckoutPlan } from "@/modules/billing/checkout";
import { acceptPendingTeamInvitation } from "@/modules/team/accept-invitation";
import { buildOnboardingFirstTalkDraft } from "@/modules/onboarding/first-talk";
import type { TalkType } from "@/types/talk";

const speakerRoles = new Set(["pastor", "conference_speaker", "trainer", "founder", "speaker"]);
const talkTypes = new Set<TalkType>(["sermon", "conference", "training", "pitch", "speech"]);
type SpeakerRole = "pastor" | "conference_speaker" | "trainer" | "founder" | "speaker";
const errors = getMessages("fr").errors;

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectWithError(path: string, message: string, params?: Record<string, string>): never {
  const query = new URLSearchParams(params);
  query.set("error", message);
  redirect(`${path}?${query.toString()}`);
}

function isSpeakerRole(value: string): value is SpeakerRole {
  return speakerRoles.has(value);
}

async function getRequestOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

function adminSignupsEnabled() {
  return process.env.SUPABASE_ADMIN_SIGNUPS === "true" && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Pull a freshly authenticated user into their team if they have a pending invitation. Wrapped so a
// failure (e.g. no service-role key) never blocks sign-in.
async function autoAcceptTeamInvitation(user: { id: string; email?: string | null } | null | undefined) {
  if (!user) return;
  try {
    await acceptPendingTeamInvitation(user);
  } catch {
    // Invitation acceptance is best-effort; never break the auth flow over it.
  }
}

export async function signUp(formData: FormData) {
  const fullName = getString(formData, "name");
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const checkoutRequested = getString(formData, "checkout") === "1";
  const checkoutPlan = getCheckoutPlan(getString(formData, "plan"));
  const localeValue = getString(formData, "locale");
  const locale = isLocale(localeValue) ? localeValue : "fr";
  const checkoutRedirect = checkoutRequested && checkoutPlan ? `/api/billing/checkout?plan=${checkoutPlan.id}&locale=${locale}` : "";

  if (!email || !password) {
    redirectWithError("/signup", errors.emailPasswordRequired, { email });
  }

  const passwordError = passwordValidationError(password);
  if (passwordError) {
    redirectWithError("/signup", passwordError, { email });
  }

  const supabase = await createClient();

  if (adminSignupsEnabled()) {
    const admin = createAdminClient();
    const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    });

    if (createError) {
      redirectWithError("/signup", authErrorMessage(createError.message), { email });
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) {
      redirectWithError("/login", authErrorMessage(loginError.message), { email });
    }

    if (createdUser.user) {
      getPostHogClient().capture({
        distinctId: createdUser.user.id,
        event: "user_signed_up",
        properties: { method: "email", has_name: Boolean(fullName) }
      });
    }

    await autoAcceptTeamInvitation(createdUser.user);
    redirect(checkoutRedirect || `/onboarding?next=${encodeURIComponent(firstLoginDestination(""))}`);
  }

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
    redirectWithError("/signup", authErrorMessage(error.message), { email });
  }

  if (!data.session) {
    redirect(
      `/signup?${new URLSearchParams({
        email,
        message: errors.signupPending.replace("{email}", email)
      }).toString()}`
    );
  }

  if (data.user) {
    getPostHogClient().capture({
      distinctId: data.user.id,
      event: "user_signed_up",
      properties: { method: "email", has_name: Boolean(fullName) }
    });
  }

  await autoAcceptTeamInvitation(data.user);
  redirect(checkoutRedirect || `/onboarding?next=${encodeURIComponent(firstLoginDestination(""))}`);
}

export async function login(formData: FormData) {
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const next = getString(formData, "next");

  if (!email || !password) {
    redirectWithError("/login", errors.emailPasswordRequired);
  }

  const supabase = await createClient();
  const { data: loginData, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirectWithError("/login", authErrorMessage(error.message));
  }

  if (loginData.user) {
    getPostHogClient().capture({
      distinctId: loginData.user.id,
      event: "user_logged_in",
      properties: { method: "email" }
    });
  }

  await autoAcceptTeamInvitation(loginData.user);
  const destination = firstLoginDestination(next);
  redirect(`/onboarding?next=${encodeURIComponent(destination)}`);
}

export async function loginWithGoogle(formData: FormData) {
  const next = getString(formData, "next");
  const source = safeNext(getString(formData, "source"), "/login");
  const errorPath = source === "/signup" ? "/signup" : "/login";
  const requestOrigin = await getRequestOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: buildOAuthRedirectTo(process.env.NEXT_PUBLIC_SITE_URL, requestOrigin, next)
    }
  });

  if (error || !data.url) {
    redirectWithError(errorPath, authErrorMessage(error?.message ?? errors.googleLoginFailed));
  }

  redirect(data.url);
}

export async function requestPasswordReset(formData: FormData) {
  const email = getString(formData, "email");

  if (!email) {
    redirectWithError("/forgot-password", errors.forgotEmailRequired);
  }

  const requestOrigin = await getRequestOrigin();
  const supabase = await createClient();

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: buildPasswordRecoveryRedirectTo(process.env.NEXT_PUBLIC_SITE_URL, requestOrigin)
  });

  redirect(`/forgot-password?message=${encodeURIComponent(errors.forgotEmailSent)}`);
}

export async function updatePassword(formData: FormData) {
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirmPassword");

  if (!password || !confirmPassword) {
    redirectWithError("/reset-password", errors.passwordConfirmationRequired);
  }

  if (password !== confirmPassword) {
    redirectWithError("/reset-password", errors.passwordMismatch);
  }

  const passwordError = passwordValidationError(password);
  if (passwordError) {
    redirectWithError("/reset-password", passwordError);
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirectWithError("/forgot-password", errors.resetLinkExpired);
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirectWithError("/reset-password", authErrorMessage(error.message));
  }

  redirect(`/login?message=${encodeURIComponent(errors.passwordUpdated)}`);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/login?message=${encodeURIComponent(errors.loggedOut)}`);
}

export async function completeOnboarding(formData: FormData) {
  const next = safeNext(getString(formData, "next"));
  const localeValue = getString(formData, "locale");
  const locale = isLocale(localeValue) ? localeValue : "fr";
  const speakerRole = getString(formData, "speakerRole");
  const primaryTalkType = getString(formData, "primaryTalkType") as TalkType;
  const helpRequested = getString(formData, "helpRequested") === "yes";
  const supportNote = getString(formData, "supportNote").slice(0, 600);

  if (!isSpeakerRole(speakerRole)) {
    redirectWithError("/onboarding", errors.onboardingRoleRequired, { next });
  }

  if (!talkTypes.has(primaryTalkType)) {
    redirectWithError("/onboarding", errors.onboardingTalkTypeRequired, { next });
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

  const { count } = await supabase
    .from("talks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (!count) {
    const draft = buildOnboardingFirstTalkDraft({ locale, type: primaryTalkType, userId: user.id });
    const { data: talk, error: talkError } = await supabase
      .from("talks")
      .insert(draft.talk)
      .select("id")
      .single();

    if (talkError) {
      redirectWithError("/onboarding", talkError.message, { next });
    }

    const { error: sectionError } = await supabase
      .from("talk_sections")
      .insert({
        ...draft.section,
        talk_id: talk.id
      });

    if (sectionError) {
      redirectWithError("/onboarding", sectionError.message, { next });
    }

    redirect(localizedPath(`/talks/${talk.id}`, locale));
  }

  getPostHogClient().capture({
    distinctId: user.id,
    event: "onboarding_completed",
    properties: {
      speaker_role: speakerRole,
      primary_talk_type: primaryTalkType,
      help_requested: helpRequested
    }
  });

  redirect(localizedPath(next, locale));
}
