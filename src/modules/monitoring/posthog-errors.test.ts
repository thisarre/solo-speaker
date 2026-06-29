import assert from "node:assert/strict";
import test from "node:test";
import { fetchRecentErrors } from "./posthog-errors";

function jsonFetch(payload: unknown, ok = true): typeof fetch {
  return (async () => ({ ok, json: async () => payload })) as unknown as typeof fetch;
}

test("fetchRecentErrors is unconfigured without a key or project", async () => {
  assert.deepEqual(await fetchRecentErrors({ apiKey: "x" }), { status: "unconfigured" });
  assert.deepEqual(await fetchRecentErrors({ projectId: "1" }), { status: "unconfigured" });
});

test("fetchRecentErrors aggregates count and top error types", async () => {
  const summary = await fetchRecentErrors(
    { projectId: "482974", apiKey: "phx_test" },
    jsonFetch({ results: [["TypeError", 5], ["RangeError", 2], ["Error", 1], ["X", 1]] })
  );
  assert.equal(summary.status, "ok");
  if (summary.status === "ok") {
    assert.equal(summary.count, 9);
    assert.equal(summary.topErrors.length, 3);
    assert.equal(summary.topErrors[0].type, "TypeError");
  }
});

test("fetchRecentErrors returns error status on a failed query", async () => {
  assert.deepEqual(await fetchRecentErrors({ projectId: "1", apiKey: "x" }, jsonFetch({}, false)), { status: "error" });
});
