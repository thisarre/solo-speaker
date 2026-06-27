import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export type AiRateLimitRoute = "generate" | "speak" | "transcribe" | "help_chat" | "deepgram_token";

export type RateLimitRule = {
  limit: number;
  windowSeconds: number;
};

export type RateLimitIdentity = {
  ip?: string | null;
  userId?: string | null;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds: number;
};

type MemoryBucket = {
  count: number;
  resetAt: Date;
  windowStartMs: number;
};

type PersistentRateLimitRow = {
  allowed: boolean;
  limit_value: number;
  remaining: number;
  reset_at: string;
};

const routeEnvKeys: Record<AiRateLimitRoute, string> = {
  deepgram_token: "AI_RATE_LIMIT_DEEPGRAM_TOKEN",
  generate: "AI_RATE_LIMIT_GENERATE",
  help_chat: "AI_RATE_LIMIT_HELP_CHAT",
  speak: "AI_RATE_LIMIT_SPEAK",
  transcribe: "AI_RATE_LIMIT_TRANSCRIBE"
};

const defaultRouteLimits: Record<AiRateLimitRoute, number> = {
  deepgram_token: 30,
  generate: 12,
  help_chat: 20,
  speak: 8,
  transcribe: 6
};

const memoryBuckets = new Map<string, MemoryBucket>();

function integerFromEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.floor(value));
}

function secondsUntil(resetAt: Date, now = new Date()) {
  return Math.max(1, Math.ceil((resetAt.getTime() - now.getTime()) / 1000));
}

export function getAiRateLimitRule(route: AiRateLimitRoute): RateLimitRule {
  return {
    limit: integerFromEnv(routeEnvKeys[route], defaultRouteLimits[route]),
    windowSeconds: integerFromEnv("AI_RATE_LIMIT_WINDOW_SECONDS", 60)
  };
}

export function getRateLimitIdentityKey(identity: RateLimitIdentity) {
  if (identity.userId) return `user:${identity.userId}`;

  const ip = identity.ip?.trim();
  if (!ip) return "anonymous:unknown";

  return `ip:${createHash("sha256").update(ip).digest("hex")}`;
}

export function getRequestIp(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return headers.get("cf-connecting-ip")?.trim() || headers.get("x-real-ip")?.trim() || forwardedFor || null;
}

export function resetMemoryRateLimits() {
  memoryBuckets.clear();
}

export function consumeMemoryRateLimit(input: {
  identityKey: string;
  limit: number;
  now?: Date;
  route: AiRateLimitRoute;
  windowSeconds: number;
}): RateLimitResult {
  const now = input.now ?? new Date();
  const windowMs = input.windowSeconds * 1000;
  const windowStartMs = Math.floor(now.getTime() / windowMs) * windowMs;
  const resetAt = new Date(windowStartMs + windowMs);
  const bucketKey = `${input.route}:${input.identityKey}:${windowStartMs}`;
  const existing = memoryBuckets.get(bucketKey);
  const count = (existing?.count ?? 0) + 1;

  memoryBuckets.set(bucketKey, {
    count,
    resetAt,
    windowStartMs
  });

  const allowed = count <= input.limit;

  return {
    allowed,
    limit: input.limit,
    remaining: Math.max(input.limit - count, 0),
    resetAt,
    retryAfterSeconds: allowed ? 0 : secondsUntil(resetAt, now)
  };
}

export function buildRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(Math.floor(result.resetAt.getTime() / 1000))
  };

  if (!result.allowed) {
    headers["Retry-After"] = String(result.retryAfterSeconds);
  }

  return headers;
}

export function isAiRateLimitEnabled() {
  return process.env.AI_RATE_LIMIT_ENABLED !== "false";
}

function shouldFailClosed() {
  return process.env.AI_RATE_LIMIT_STRICT === "true" || process.env.NODE_ENV === "production";
}

async function consumePersistentRateLimit(input: {
  identityKey: string;
  limit: number;
  route: AiRateLimitRoute;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("consume_ai_rate_limit" as never, {
    p_limiter_key: input.identityKey,
    p_limit: input.limit,
    p_route: input.route,
    p_window_seconds: input.windowSeconds
  } as never);

  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? (data[0] as PersistentRateLimitRow | undefined) : undefined;
  if (!row) {
    throw new Error("consume_ai_rate_limit returned no data.");
  }

  const resetAt = new Date(row.reset_at);

  return {
    allowed: Boolean(row.allowed),
    limit: Number(row.limit_value),
    remaining: Number(row.remaining),
    resetAt,
    retryAfterSeconds: row.allowed ? 0 : secondsUntil(resetAt)
  };
}

export async function consumeAiRateLimit(input: {
  identity: RateLimitIdentity;
  route: AiRateLimitRoute;
}): Promise<RateLimitResult & { headers: Record<string, string> }> {
  const rule = getAiRateLimitRule(input.route);
  const identityKey = getRateLimitIdentityKey(input.identity);
  let result: RateLimitResult;

  if (!isAiRateLimitEnabled()) {
    result = {
      allowed: true,
      limit: rule.limit,
      remaining: rule.limit,
      resetAt: new Date(Date.now() + rule.windowSeconds * 1000),
      retryAfterSeconds: 0
    };
    return { ...result, headers: buildRateLimitHeaders(result) };
  }

  try {
    result = await consumePersistentRateLimit({
      identityKey,
      limit: rule.limit,
      route: input.route,
      windowSeconds: rule.windowSeconds
    });
  } catch (error) {
    if (shouldFailClosed()) {
      throw error;
    }

    result = consumeMemoryRateLimit({
      identityKey,
      limit: rule.limit,
      route: input.route,
      windowSeconds: rule.windowSeconds
    });
  }

  return { ...result, headers: buildRateLimitHeaders(result) };
}
