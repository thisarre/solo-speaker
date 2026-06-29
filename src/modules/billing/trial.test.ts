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
    ctaLabel: "Garder mon accès",
    href: "/pricing",
    label: "Essai gratuit",
    message: "Plus que 5 jours pour garder vos prises de parole illimitées et l’IA complète."
  });
});

test("getTrialReminder handles trial end without hiding billing context", () => {
  const reminder = getTrialReminder({
    copy,
    now: new Date("2026-06-17T12:00:00.000Z"),
    trialStartedAt: "2026-06-01T12:00:00.000Z"
  });

  assert.equal(reminder.message, "Votre essai est terminé — ne perdez pas vos prises de parole. Repassez en illimité.");
});

test("getTrialReminder falls back when the profile creation date is missing", () => {
  assert.equal(getTrialReminder({ copy, trialStartedAt: null }).message, "14 jours gratuits, 5 prises de parole incluses.");
});
