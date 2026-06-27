import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRateLimitHeaders,
  consumeMemoryRateLimit,
  getAiRateLimitRule,
  getRateLimitIdentityKey,
  resetMemoryRateLimits
} from "./rate-limit";

test("getAiRateLimitRule reads route-specific environment overrides", () => {
  const previousLimit = process.env.AI_RATE_LIMIT_GENERATE;
  const previousWindow = process.env.AI_RATE_LIMIT_WINDOW_SECONDS;

  process.env.AI_RATE_LIMIT_GENERATE = "3";
  process.env.AI_RATE_LIMIT_WINDOW_SECONDS = "120";

  try {
    assert.deepEqual(getAiRateLimitRule("generate"), {
      limit: 3,
      windowSeconds: 120
    });
  } finally {
    if (previousLimit === undefined) delete process.env.AI_RATE_LIMIT_GENERATE;
    else process.env.AI_RATE_LIMIT_GENERATE = previousLimit;

    if (previousWindow === undefined) delete process.env.AI_RATE_LIMIT_WINDOW_SECONDS;
    else process.env.AI_RATE_LIMIT_WINDOW_SECONDS = previousWindow;
  }
});

test("consumeMemoryRateLimit blocks requests after the route window is exhausted", () => {
  resetMemoryRateLimits();

  const first = consumeMemoryRateLimit({
    identityKey: "user:user-1",
    limit: 2,
    now: new Date("2026-06-27T10:00:10.000Z"),
    route: "speak",
    windowSeconds: 60
  });
  const second = consumeMemoryRateLimit({
    identityKey: "user:user-1",
    limit: 2,
    now: new Date("2026-06-27T10:00:11.000Z"),
    route: "speak",
    windowSeconds: 60
  });
  const third = consumeMemoryRateLimit({
    identityKey: "user:user-1",
    limit: 2,
    now: new Date("2026-06-27T10:00:12.000Z"),
    route: "speak",
    windowSeconds: 60
  });

  assert.equal(first.allowed, true);
  assert.equal(first.remaining, 1);
  assert.equal(second.allowed, true);
  assert.equal(second.remaining, 0);
  assert.equal(third.allowed, false);
  assert.equal(third.remaining, 0);
  assert.equal(third.retryAfterSeconds, 48);
});

test("getRateLimitIdentityKey prefers user id and hashes IP fallback", () => {
  const userKey = getRateLimitIdentityKey({ ip: "203.0.113.10", userId: "user-1" });
  const ipKey = getRateLimitIdentityKey({ ip: "203.0.113.10" });

  assert.equal(userKey, "user:user-1");
  assert.match(ipKey, /^ip:[a-f0-9]{64}$/);
  assert.notEqual(ipKey, "ip:203.0.113.10");
});

test("buildRateLimitHeaders includes retry metadata when blocked", () => {
  const headers = buildRateLimitHeaders({
    allowed: false,
    limit: 2,
    remaining: 0,
    resetAt: new Date("2026-06-27T10:01:00.000Z"),
    retryAfterSeconds: 30
  });

  assert.equal(headers["RateLimit-Limit"], "2");
  assert.equal(headers["RateLimit-Remaining"], "0");
  assert.equal(headers["RateLimit-Reset"], "1782554460");
  assert.equal(headers["Retry-After"], "30");
});
