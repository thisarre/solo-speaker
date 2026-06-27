import assert from "node:assert/strict";
import test from "node:test";
import { securityHeaders } from "./headers";

test("securityHeaders includes production browser protections without blocking microphone use", () => {
  const headers = new Map(securityHeaders.map((header) => [header.key, header.value]));

  assert.equal(headers.get("X-Frame-Options"), "DENY");
  assert.equal(headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(headers.get("Referrer-Policy"), "strict-origin-when-cross-origin");
  assert.equal(headers.get("Permissions-Policy")?.includes("microphone=(self)"), true);
  assert.equal(headers.get("Permissions-Policy")?.includes("camera=()"), true);
});
