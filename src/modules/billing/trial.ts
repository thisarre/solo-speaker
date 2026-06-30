import { trialTalkLimit } from "./entitlements";

type TrialReminderCopy = {
  ctaLabel: string;
  endedMessage: string;
  label: string;
  remainingMessage: string;
};

export type TrialReminder = {
  ctaLabel: string;
  href: string;
  label: string;
  message: string;
};

function formatRemainingMessage(template: string, remaining: number) {
  return template
    .replace("{count}", String(remaining))
    .replace("{plural}", remaining > 1 ? "s" : "");
}

export function getTrialReminder(input: { copy: TrialReminderCopy; currentTalkCount: number }): TrialReminder {
  const base = {
    ctaLabel: input.copy.ctaLabel,
    href: "/pricing",
    label: input.copy.label
  };

  const remaining = Math.max(0, trialTalkLimit - input.currentTalkCount);

  if (remaining <= 0) {
    return {
      ...base,
      message: input.copy.endedMessage
    };
  }

  return {
    ...base,
    message: formatRemainingMessage(input.copy.remainingMessage, remaining)
  };
}
