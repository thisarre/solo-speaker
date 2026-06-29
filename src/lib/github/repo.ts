// Thin GitHub REST helpers for the remote-coding bridges (Telegram/Slack).
// Uses GH_DISPATCH_TOKEN (a PAT with Contents + Pull requests write) + GH_REPO.

const GITHUB_API = "https://api.github.com";

type Result = { ok: boolean; error?: string };

function ghConfig(): { token?: string; repo?: string } {
  return { token: process.env.GH_DISPATCH_TOKEN?.trim(), repo: process.env.GH_REPO?.trim() };
}

function headers(token: string): Record<string, string> {
  return {
    authorization: `Bearer ${token}`,
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    "user-agent": "solo-speaker-bot",
    "content-type": "application/json"
  };
}

export async function dispatchWorkflow(eventType: string, clientPayload: Record<string, unknown>): Promise<Result> {
  const { token, repo } = ghConfig();
  if (!token || !repo) return { ok: false, error: "GitHub non configuré" };
  try {
    const response = await fetch(`${GITHUB_API}/repos/${repo}/dispatches`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({ event_type: eventType, client_payload: clientPayload })
    });
    return response.status === 204 ? { ok: true } : { ok: false, error: `GitHub ${response.status}` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "réseau" };
  }
}

export async function mergePullRequest(pr: number): Promise<Result> {
  const { token, repo } = ghConfig();
  if (!token || !repo) return { ok: false, error: "GitHub non configuré" };
  try {
    const response = await fetch(`${GITHUB_API}/repos/${repo}/pulls/${pr}/merge`, {
      method: "PUT",
      headers: headers(token),
      body: JSON.stringify({ merge_method: "squash" })
    });
    if (response.ok) return { ok: true };
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    return { ok: false, error: body.message || `GitHub ${response.status}` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "réseau" };
  }
}

export async function closePullRequest(pr: number, branch?: string): Promise<Result> {
  const { token, repo } = ghConfig();
  if (!token || !repo) return { ok: false, error: "GitHub non configuré" };
  try {
    const response = await fetch(`${GITHUB_API}/repos/${repo}/pulls/${pr}`, {
      method: "PATCH",
      headers: headers(token),
      body: JSON.stringify({ state: "closed" })
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      return { ok: false, error: body.message || `GitHub ${response.status}` };
    }
    if (branch) {
      await fetch(`${GITHUB_API}/repos/${repo}/git/refs/heads/${branch}`, { method: "DELETE", headers: headers(token) }).catch(() => {});
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "réseau" };
  }
}
