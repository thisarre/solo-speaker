// Pulls the count of client-side JS exceptions (PostHog `$exception` events)
// over a recent window via the PostHog Query API (HogQL). Pure + fetch-injectable
// so it can be unit-tested. Needs a personal API key + project id; degrades
// gracefully to an "unconfigured" status when those are missing.

export type ErrorType = { type: string; count: number };

export type ErrorSummary =
  | { status: "unconfigured" }
  | { status: "error" }
  | { status: "ok"; count: number; topErrors: ErrorType[] };

const REQUEST_TIMEOUT_MS = 15000;

export async function fetchRecentErrors(
  opts: { apiHost?: string; projectId?: string; apiKey?: string; sinceHours?: number },
  fetchImpl: typeof fetch = fetch
): Promise<ErrorSummary> {
  const projectId = opts.projectId?.trim();
  const apiKey = opts.apiKey?.trim();
  if (!projectId || !apiKey) return { status: "unconfigured" };

  const apiHost = (opts.apiHost || "https://us.posthog.com").replace(/\/+$/, "");
  const sinceHours = opts.sinceHours ?? 24;
  const query = `SELECT coalesce(properties.$exception_type, 'Exception') AS type, count() AS c FROM events WHERE event = '$exception' AND timestamp > now() - INTERVAL ${sinceHours} HOUR GROUP BY type ORDER BY c DESC LIMIT 10`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetchImpl(`${apiHost}/api/projects/${projectId}/query/`, {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ query: { kind: "HogQLQuery", query } })
    });
    if (!response.ok) return { status: "error" };

    const data = (await response.json()) as { results?: unknown };
    const rows = Array.isArray(data.results) ? (data.results as unknown[][]) : [];
    const topErrors: ErrorType[] = rows
      .filter((row) => Array.isArray(row) && row.length >= 2)
      .map((row) => ({ type: String(row[0]), count: Number(row[1]) || 0 }));
    const count = topErrors.reduce((sum, item) => sum + item.count, 0);

    return { status: "ok", count, topErrors: topErrors.slice(0, 3) };
  } catch {
    return { status: "error" };
  } finally {
    clearTimeout(timer);
  }
}
