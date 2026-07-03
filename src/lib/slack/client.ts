// Minimal Slack Web API helpers. No-op when SLACK_BOT_TOKEN is unset.

const SLACK_API = "https://slack.com/api";

export async function postSlackMessage(args: { channel: string; text: string; thread_ts?: string; blocks?: unknown[] }): Promise<void> {
  const token = process.env.SLACK_BOT_TOKEN?.trim();
  if (!token) return;
  try {
    await fetch(`${SLACK_API}/chat.postMessage`, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8", authorization: `Bearer ${token}` },
      body: JSON.stringify(args)
    });
  } catch {
    // best-effort
  }
}

// Replies to a button click via Slack's response_url. By default replaces the
// original message (consumes its buttons); replaceOriginal: false posts a
// follow-up instead, keeping the remaining buttons clickable.
export async function respondToSlackAction(responseUrl: string, text: string, options?: { replaceOriginal?: boolean }): Promise<void> {
  const replaceOriginal = options?.replaceOriginal ?? true;
  try {
    await fetch(responseUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(
        replaceOriginal ? { replace_original: true, text } : { replace_original: false, response_type: "in_channel", text }
      )
    });
  } catch {
    // best-effort
  }
}
