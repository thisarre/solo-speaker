import assert from "node:assert/strict";
import test from "node:test";
import { getProviderHealth } from "./provider-health";

test("getProviderHealth marks realtime 9930ms latency unusable", () => {
  assert.equal(getProviderHealth({ latencyMs: 9930, provider: "realtime" }), "unusable");
});

test("getProviderHealth keeps browser healthy", () => {
  assert.equal(getProviderHealth({ latencyMs: 9930, provider: "browser" }), "healthy");
});
