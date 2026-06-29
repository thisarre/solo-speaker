// Slack request authenticity + authorization. Pure (crypto only, injectable
// clock) so it is unit-testable. No I/O, no copy.
import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_SKEW_SECONDS = 300;

// Verifies the Slack request signature (X-Slack-Signature) over the RAW body.
// https://api.slack.com/authentication/verifying-requests-from-slack
export function verifySlackSignature(opts: {
  signingSecret: string | undefined;
  timestamp: string | null;
  signature: string | null;
  rawBody: string;
  nowMs?: number;
}): boolean {
  const { signingSecret, timestamp, signature, rawBody } = opts;
  if (!signingSecret || !timestamp || !signature) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const nowSec = Math.floor((opts.nowMs ?? Date.now()) / 1000);
  if (Math.abs(nowSec - ts) > MAX_SKEW_SECONDS) return false;

  const expected = `v0=${createHmac("sha256", signingSecret).update(`v0:${timestamp}:${rawBody}`).digest("hex")}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isAuthorizedSlackUser(userId: string | undefined | null, allowed: string | undefined | null): boolean {
  const list = (allowed ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  if (list.length === 0) return false;
  return Boolean(userId) && list.includes(String(userId));
}

// Strips leading <@U…> bot mentions from an app_mention so only the task remains.
export function extractTaskText(text: string | undefined | null): string {
  return (text ?? "").replace(/<@[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
