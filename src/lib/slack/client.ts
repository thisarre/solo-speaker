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

// Updates the original message a button belongs to, via Slack's response_url.
export async function respondToSlackAction(responseUrl: string, text: string): Promise<void> {
  try {
    await fetch(responseUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ replace_original: true, text })
    });
  } catch {
    // best-effort
  }
}
