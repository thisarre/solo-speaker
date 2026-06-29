// Reads the Playwright JSON report and POSTs a compact summary to the app's
// browser-report endpoint, which emails it. Runs in CI after the e2e run.
import { readFile } from "node:fs/promises";

const url = process.env.REPORT_URL;
const secret = process.env.CRON_SECRET;

function collectFailures(suites = []) {
  const out = [];
  for (const suite of suites) {
    for (const spec of suite.specs ?? []) {
      const failed = (spec.tests ?? []).some((t) => (t.results ?? []).some((r) => r.status !== "passed" && r.status !== "skipped"));
      if (failed) {
        const error = (spec.tests ?? [])
          .flatMap((t) => t.results ?? [])
          .flatMap((r) => (r.errors ?? []).map((e) => e.message))
          .find(Boolean);
        out.push({ title: spec.title, error: (error || "failed").split("\n")[0].slice(0, 300) });
      }
    }
    out.push(...collectFailures(suite.suites));
  }
  return out;
}

async function readResults() {
  const candidates = [new URL("./results.json", import.meta.url), new URL("../results.json", import.meta.url), new URL("../e2e/results.json", import.meta.url)];
  for (const candidate of candidates) {
    try {
      return JSON.parse(await readFile(candidate, "utf8"));
    } catch {
      // try next candidate
    }
  }
  throw new Error("results.json not found");
}

let summary = { passed: 0, failed: 0, total: 0, failures: [] };
try {
  const data = await readResults();
  const stats = data.stats ?? {};
  summary.passed = stats.expected ?? 0;
  summary.failed = stats.unexpected ?? 0;
  summary.total = (stats.expected ?? 0) + (stats.unexpected ?? 0) + (stats.flaky ?? 0) + (stats.skipped ?? 0);
  summary.failures = collectFailures(data.suites);
} catch (error) {
  summary = { passed: 0, failed: 1, total: 1, failures: [{ title: "test runner", error: String(error).slice(0, 300) }] };
}

if (!url || !secret) {
  console.log("REPORT_URL or CRON_SECRET missing; summary:", JSON.stringify(summary));
  process.exit(0);
}

const response = await fetch(url, {
  method: "POST",
  headers: { "content-type": "application/json", authorization: `Bearer ${secret}` },
  body: JSON.stringify(summary)
});
console.log("Posted browser report:", response.status, JSON.stringify(summary));
