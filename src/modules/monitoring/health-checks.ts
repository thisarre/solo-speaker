// Synthetic monitoring: probe the live site over HTTP and classify each page as
// ok / warn / fail. Pure and dependency-free (fetch is injectable) so it can be
// unit-tested. Diagnostic strings are kept ASCII/English on purpose; the daily
// email template (src/lib/email) wraps them in localized copy.

export type HealthCheck = {
  name: string;
  path: string;
  expectStatus?: number;
  mustContain?: string[];
  mustNotContain?: string[];
  warnAboveMs?: number;
};

export type CheckLevel = "ok" | "warn" | "fail";

export type CheckResult = {
  name: string;
  path: string;
  url: string;
  level: CheckLevel;
  status: number | null;
  durationMs: number;
  issues: string[];
};

export type HealthSummary = { total: number; ok: number; warn: number; fail: number; healthy: boolean };

export type HealthReport = {
  baseUrl: string;
  results: CheckResult[];
  summary: HealthSummary;
};

const REQUEST_TIMEOUT_MS = 15000;
const DEFAULT_WARN_MS = 3000;

// Strings that should never appear in a healthy HTML response.
const ERROR_MARKERS = ["Application error", "Internal Server Error", "This page could not be found"];

export const DEFAULT_CHECKS: HealthCheck[] = [
  { name: "Home (FR)", path: "/fr", mustContain: ["Solo Speaker"] },
  { name: "Home (EN)", path: "/en", mustContain: ["Solo Speaker"] },
  { name: "Pricing (FR)", path: "/fr/pricing", mustContain: ["EUR"] },
  { name: "Login (FR)", path: "/fr/login", mustContain: ['name="email"'] },
  { name: "Signup (FR)", path: "/fr/signup", mustContain: ['name="confirmPassword"'] },
  { name: "Health API", path: "/api/health", mustContain: ['"status":"ok"'] },
  { name: "Sitemap", path: "/sitemap.xml", mustContain: ["<urlset"] },
  { name: "Robots", path: "/robots.txt" }
];

export async function runHealthCheck(baseUrl: string, check: HealthCheck, fetchImpl: typeof fetch): Promise<CheckResult> {
  const url = `${baseUrl}${check.path}`;
  const expectStatus = check.expectStatus ?? 200;
  const warnMs = check.warnAboveMs ?? DEFAULT_WARN_MS;
  const issues: string[] = [];
  const start = Date.now();
  let status: number | null = null;
  let durationMs = 0;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const response = await fetchImpl(url, {
      redirect: "manual",
      signal: controller.signal,
      headers: { "user-agent": "SoloSpeaker-HealthCheck/1.0", "cache-control": "no-cache" }
    });
    clearTimeout(timer);
    durationMs = Date.now() - start;
    status = response.status;

    if (response.status !== expectStatus) {
      issues.push(`Status ${response.status} (expected ${expectStatus})`);
    }

    const body = await response.text();
    for (const needle of check.mustContain ?? []) {
      if (!body.includes(needle)) issues.push(`Missing content: ${needle}`);
    }
    for (const marker of [...(check.mustNotContain ?? []), ...ERROR_MARKERS]) {
      if (body.includes(marker)) issues.push(`Error marker: ${marker}`);
    }
  } catch (error) {
    durationMs = Date.now() - start;
    issues.push(`Request failed: ${error instanceof Error ? error.message : "network error"}`);
  }

  let level: CheckLevel = issues.length > 0 ? "fail" : "ok";
  if (level === "ok" && durationMs > warnMs) {
    level = "warn";
    issues.push(`Slow response: ${durationMs} ms`);
  }

  return { name: check.name, path: check.path, url, level, status, durationMs, issues };
}

export async function runHealthChecks(baseUrl: string, checks: HealthCheck[] = DEFAULT_CHECKS, fetchImpl: typeof fetch = fetch): Promise<HealthReport> {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const results = await Promise.all(checks.map((check) => runHealthCheck(normalizedBase, check, fetchImpl)));
  const ok = results.filter((result) => result.level === "ok").length;
  const warn = results.filter((result) => result.level === "warn").length;
  const fail = results.filter((result) => result.level === "fail").length;

  return {
    baseUrl: normalizedBase,
    results,
    summary: { total: results.length, ok, warn, fail, healthy: fail === 0 }
  };
}
