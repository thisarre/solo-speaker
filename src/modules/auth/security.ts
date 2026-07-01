import { getMessages } from "@/i18n/messages";
import { getPathWithoutLocale } from "@/i18n/routing";
import { getPasswordPolicyError } from "./password-strength";

const errors = getMessages("fr").errors;

const defaultAppPath = "/dashboard";
export const firstTalkOnboardingPath = "/talks/new?guided=1&welcome=1";

export function safeNext(value: string | null | undefined, fallback = defaultAppPath) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export function firstLoginDestination(value: string | null | undefined) {
  const destination = safeNext(value, firstTalkOnboardingPath);
  return destination === "/dashboard" ? firstTalkOnboardingPath : destination;
}

export function isProtectedAppPath(pathname: string) {
  const normalizedPathname = getPathWithoutLocale(pathname);

  return (
    normalizedPathname === "/dashboard" ||
    normalizedPathname === "/settings" ||
    normalizedPathname === "/progression" ||
    normalizedPathname === "/onboarding" ||
    normalizedPathname === "/talks" ||
    normalizedPathname.startsWith("/talks/") ||
    normalizedPathname.startsWith("/analytics/")
  );
}

export function passwordValidationError(password: string, email?: string) {
  switch (getPasswordPolicyError(password, email)) {
    case "min":
      return errors.passwordMinLength;
    case "lettersNumbers":
      return errors.passwordLettersNumbers;
    case "common":
      return errors.passwordTooCommon;
    default:
      return null;
  }
}

export function authErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return errors.invalidCredentials;
  }

  if (normalized.includes("already registered") || normalized.includes("already exists")) {
    return errors.accountExists;
  }

  if (normalized.includes("email not confirmed") || normalized.includes("not confirmed")) {
    return errors.emailNotConfirmed;
  }

  if (normalized.includes("rate limit") || normalized.includes("over_email_send_rate_limit")) {
    return errors.emailRateLimit;
  }

  if (normalized.includes("password")) {
    return errors.passwordMinLength;
  }

  if (normalized.includes("email")) {
    return errors.generic;
  }

  return message || errors.generic;
}

function normalizeOrigin(origin: string | undefined, fallbackOrigin: string) {
  const rawOrigin = (origin || fallbackOrigin).trim().replace(/\/+$/, "");

  try {
    const url = new URL(rawOrigin);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.origin;
    }
  } catch {
    // Fall back below.
  }

  return fallbackOrigin.replace(/\/+$/, "");
}

export function buildPasswordRecoveryRedirectTo(publicSiteUrl: string | undefined, requestOrigin: string) {
  const origin = normalizeOrigin(publicSiteUrl, requestOrigin);
  const params = new URLSearchParams({ next: "/reset-password" });
  return `${origin}/auth/callback?${params.toString()}`;
}

export function buildOAuthRedirectTo(publicSiteUrl: string | undefined, requestOrigin: string, next: string | null | undefined) {
  const origin = normalizeOrigin(publicSiteUrl, requestOrigin);
  const params = new URLSearchParams({ next: safeNext(next) });
  return `${origin}/auth/callback?${params.toString()}`;
}

export function buildAuthCallbackRedirect(origin: string, next: string | null | undefined) {
  return `${normalizeOrigin(origin, origin)}${safeNext(next)}`;
}
