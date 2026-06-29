// Pure parsing + authorization for the Telegram coding bridge. No I/O, no copy
// (user-facing replies live in the API route). Kept ASCII so it passes the
// no-hardcoded-UI-copy guard while staying unit-testable.

export type TelegramCommand =
  | { type: "help" }
  | { type: "task"; prompt: string }
  | { type: "merge"; pr: number }
  | { type: "status" }
  | { type: "ignore" };

export function isAuthorized(fromId: number | string | undefined | null, ownerId: string | undefined | null): boolean {
  const owner = (ownerId ?? "").trim();
  if (!owner) return false;
  return String(fromId ?? "").trim() === owner;
}

export function parseCommand(text: string | undefined | null): TelegramCommand {
  const value = (text ?? "").trim();
  if (!value) return { type: "ignore" };

  if (value === "/start" || value === "/help") return { type: "help" };
  if (value === "/status") return { type: "status" };

  const merge = value.match(/^\/merge\s+#?(\d+)\b/i);
  if (merge) return { type: "merge", pr: Number(merge[1]) };

  if (/^\/code(\s|$)/i.test(value)) {
    const prompt = value.replace(/^\/code\s*/i, "").trim();
    return prompt ? { type: "task", prompt } : { type: "help" };
  }

  // Any unrecognized slash command is ignored; plain text is treated as a task.
  if (value.startsWith("/")) return { type: "ignore" };
  return { type: "task", prompt: value };
}
