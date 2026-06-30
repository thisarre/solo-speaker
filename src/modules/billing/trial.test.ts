import assert from "node:assert/strict";
import test from "node:test";
import { getMessages } from "@/i18n/messages";
import { getTrialReminder } from "./trial";

const copy = getMessages("fr").trial;

test("getTrialReminder shows the plural remaining talks during the trial", () => {
  const reminder = getTrialReminder({ copy, currentTalkCount: 2 });

  assert.deepEqual(reminder, {
    ctaLabel: "Garder mon accès",
    href: "/pricing",
    label: "Essai gratuit",
    message: "Plus que 3 prises de parole pour garder vos prises de parole illimitées et l’IA complète."
  });
  assert.ok(reminder.message.includes("3"));
});

test("getTrialReminder uses the singular form when one talk remains", () => {
  const reminder = getTrialReminder({ copy, currentTalkCount: 4 });

  assert.equal(
    reminder.message,
    "Plus que 1 prise de parole pour garder vos prises de parole illimitées et l’IA complète."
  );
});

test("getTrialReminder shows the ended message once the trial cap is reached", () => {
  assert.equal(
    getTrialReminder({ copy, currentTalkCount: 5 }).message,
    "Votre essai est terminé. Ne perdez pas vos prises de parole. Repassez en illimité."
  );
  assert.equal(
    getTrialReminder({ copy, currentTalkCount: 8 }).message,
    "Votre essai est terminé. Ne perdez pas vos prises de parole. Repassez en illimité."
  );
});
