import assert from "node:assert/strict";
import test from "node:test";
import { getMessages } from "@/i18n/messages";
import { getTrialReminder } from "./trial";

const copy = getMessages("fr").trial;

test("getTrialReminder shows remaining days during the 14 day trial", () => {
  const reminder = getTrialReminder({
    copy,
    now: new Date("2026-06-10T12:00:00.000Z"),
    trialStartedAt: "2026-06-01T12:00:00.000Z"
  });

  assert.deepEqual(reminder, {
    ctaLabel: "Voir l’abonnement",
    href: "/pricing",
    label: "Essai gratuit",
    message: "5 jours restants avant l’abonnement."
  });
});

test("getTrialReminder handles trial end without hiding billing context", () => {
  const reminder = getTrialReminder({
    copy,
    now: new Date("2026-06-17T12:00:00.000Z"),
    trialStartedAt: "2026-06-01T12:00:00.000Z"
  });

  assert.equal(reminder.message, "Essai terminé. Choisissez un abonnement pour garder l’accès.");
});

test("getTrialReminder falls back when the profile creation date is missing", () => {
  assert.equal(getTrialReminder({ copy, trialStartedAt: null }).message, "14 jours gratuits, 5 prises de parole incluses.");
});
