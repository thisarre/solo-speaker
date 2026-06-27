const trialDays = 14;
const dayMs = 24 * 60 * 60 * 1000;

type TrialReminderCopy = {
  ctaLabel: string;
  defaultMessage: string;
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

function formatRemainingMessage(template: string, remainingDays: number) {
  return template
    .replace("{count}", String(remainingDays))
    .replace("{plural}", remainingDays > 1 ? "s" : "");
}

export function getTrialReminder(input: { copy: TrialReminderCopy; now?: Date; trialStartedAt?: string | null }): TrialReminder {
  const base = {
    ctaLabel: input.copy.ctaLabel,
    href: "/pricing",
    label: input.copy.label
  };

  if (!input.trialStartedAt) {
    return {
      ...base,
      message: input.copy.defaultMessage
    };
  }

  const now = input.now ?? new Date();
  const startedAt = new Date(input.trialStartedAt);

  if (Number.isNaN(startedAt.getTime())) {
    return {
      ...base,
      message: input.copy.defaultMessage
    };
  }

  const elapsedDays = Math.floor((now.getTime() - startedAt.getTime()) / dayMs);
  const remainingDays = Math.max(0, trialDays - elapsedDays);

  if (remainingDays <= 0) {
    return {
      ...base,
      message: input.copy.endedMessage
    };
  }

  return {
    ...base,
    message: formatRemainingMessage(input.copy.remainingMessage, remainingDays)
  };
}
