import assert from "node:assert/strict";
import test from "node:test";
import { getMessages } from "@/i18n/messages";
import {
  buildAuthCallbackRedirect,
  authErrorMessage,
  buildOAuthRedirectTo,
  buildPasswordRecoveryRedirectTo,
  firstLoginDestination,
  isProtectedAppPath,
  passwordValidationError,
  safeNext
} from "./security";

const errors = getMessages("fr").errors;

test("safeNext only accepts local application paths", () => {
  assert.equal(safeNext("/dashboard"), "/dashboard");
  assert.equal(safeNext("//evil.example"), "/dashboard");
  assert.equal(safeNext("https://evil.example"), "/dashboard");
});

test("isProtectedAppPath covers private studio sections", () => {
  assert.equal(isProtectedAppPath("/dashboard"), true);
  assert.equal(isProtectedAppPath("/talks/abc/speak"), true);
  assert.equal(isProtectedAppPath("/settings"), true);
  assert.equal(isProtectedAppPath("/progression"), true);
  assert.equal(isProtectedAppPath("/onboarding"), true);
  assert.equal(isProtectedAppPath("/login"), false);
});

test("passwordValidationError stays lenient but blocks unsafe passwords", () => {
  assert.equal(passwordValidationError("short7!"), errors.passwordMinLength);
  assert.equal(passwordValidationError("abcdefghij"), errors.passwordLettersNumbers);
  assert.equal(passwordValidationError("password1"), errors.passwordTooCommon);
  assert.equal(passwordValidationError("12345678"), errors.passwordLettersNumbers);
  assert.equal(passwordValidationError("test1234"), null);
  assert.equal(passwordValidationError("Sunrise7Path"), null);
});

test("passwordValidationError rejects passwords too close to the email", () => {
  assert.equal(passwordValidationError("Thierno2026", "thierno@example.com"), errors.passwordTooCommon);
});

test("authErrorMessage keeps signup failures actionable", () => {
  assert.equal(authErrorMessage("User already registered"), errors.accountExists);
  assert.equal(authErrorMessage("Email not confirmed"), errors.emailNotConfirmed);
  assert.equal(authErrorMessage("Unable to validate email address: invalid format"), errors.generic);
  assert.equal(authErrorMessage("email rate limit exceeded"), errors.emailRateLimit);
});

test("buildPasswordRecoveryRedirectTo uses the public site URL when configured", () => {
  const redirectTo = buildPasswordRecoveryRedirectTo("https://studio.example.com", "http://localhost:3000");

  assert.equal(redirectTo, "https://studio.example.com/auth/callback?next=%2Freset-password");
});

test("buildOAuthRedirectTo keeps Google auth destinations local", () => {
  assert.equal(buildOAuthRedirectTo("https://studio.example.com", "http://localhost:3000", "/talks"), "https://studio.example.com/auth/callback?next=%2Ftalks");
  assert.equal(buildOAuthRedirectTo("https://studio.example.com", "http://localhost:3000", "https://evil.example"), "https://studio.example.com/auth/callback?next=%2Fdashboard");
});

test("buildAuthCallbackRedirect keeps callback navigation relative", () => {
  assert.equal(buildAuthCallbackRedirect("https://studio.example.com", "/reset-password"), "https://studio.example.com/reset-password");
  assert.equal(buildAuthCallbackRedirect("https://studio.example.com", "https://evil.example"), "https://studio.example.com/dashboard");
});

test("firstLoginDestination sends new users to the guided first talk by default", () => {
  assert.equal(firstLoginDestination(""), "/talks/new?guided=1&welcome=1");
  assert.equal(firstLoginDestination("/dashboard"), "/talks/new?guided=1&welcome=1");
  assert.equal(firstLoginDestination("/settings"), "/settings");
});
