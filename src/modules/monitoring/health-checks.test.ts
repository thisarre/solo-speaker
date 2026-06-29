import assert from "node:assert/strict";
import test from "node:test";
import { runHealthChecks, type HealthCheck } from "./health-checks";

type FakeEntry = { status?: number; body?: string; throw?: boolean };

function fakeFetch(map: Record<string, FakeEntry>): typeof fetch {
  return (async (input: string) => {
    const path = new URL(input).pathname;
    const entry = map[path];
    if (!entry || entry.throw) throw new Error("network error");
    return { status: entry.status ?? 200, text: async () => entry.body ?? "" };
  }) as unknown as typeof fetch;
}

const CHECKS: HealthCheck[] = [
  { name: "Home", path: "/fr", mustContain: ["Solo Speaker"] },
  { name: "Robots", path: "/robots.txt" }
];

test("runHealthChecks reports healthy when every check passes", async () => {
  const report = await runHealthChecks(
    "https://example.com/",
    CHECKS,
    fakeFetch({ "/fr": { body: "<h1>Solo Speaker</h1>" }, "/robots.txt": { body: "User-agent: *" } })
  );

  assert.equal(report.summary.healthy, true);
  assert.equal(report.summary.fail, 0);
  assert.equal(report.summary.ok, 2);
  assert.equal(report.baseUrl, "https://example.com");
});

test("runHealthChecks fails on bad status, missing content and error markers", async () => {
  const status = await runHealthChecks("https://example.com", CHECKS, fakeFetch({ "/fr": { status: 500, body: "Solo Speaker" }, "/robots.txt": { body: "" } }));
  assert.equal(status.results[0].level, "fail");
  assert.ok(status.results[0].issues.some((i) => i.includes("500")));

  const missing = await runHealthChecks("https://example.com", CHECKS, fakeFetch({ "/fr": { body: "nothing here" }, "/robots.txt": { body: "" } }));
  assert.equal(missing.results[0].level, "fail");
  assert.ok(missing.results[0].issues.some((i) => i.includes("Missing content")));

  const errored = await runHealthChecks("https://example.com", CHECKS, fakeFetch({ "/fr": { body: "Solo Speaker Application error" }, "/robots.txt": { body: "" } }));
  assert.equal(errored.results[0].level, "fail");
  assert.ok(errored.results[0].issues.some((i) => i.includes("Error marker")));
});

test("runHealthChecks marks a check failed when the request throws", async () => {
  const report = await runHealthChecks("https://example.com", CHECKS, fakeFetch({ "/robots.txt": { body: "" } }));
  assert.equal(report.results[0].level, "fail");
  assert.equal(report.results[0].status, null);
  assert.equal(report.summary.healthy, false);
});
