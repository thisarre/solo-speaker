import { NextResponse, type NextRequest } from "next/server";
import { consumeAiRateLimit, getRequestIp } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActivePlan } from "@/modules/billing/active-plan";
import { decideCloudAllowed, decideSessionReuse, GRANT_TTL_SECONDS } from "@/modules/billing/stt-metering";
import { getPostHogClient } from "@/lib/posthog-server";

export const runtime = "nodejs";

type DeepgramGrantResponse = {
  access_token?: string;
  expires_in?: number;
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "DEEPGRAM_API_KEY is not configured." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Session required." }, { status: 401 });
  }

  let rateLimit;

  try {
    rateLimit = await consumeAiRateLimit({
      identity: {
        ip: getRequestIp(request.headers),
        userId: user.id
      },
      route: "deepgram_token"
    });
  } catch {
    return NextResponse.json({ error: "Rate limit protection unavailable." }, { status: 503 });
  }

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many voice token requests. Try again shortly." }, { headers: rateLimit.headers, status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as { sessionId?: string; talkId?: string };
  const sessionId = typeof body.sessionId === "string" && body.sessionId.length > 0 ? body.sessionId : null;
  const talkId = typeof body.talkId === "string" && body.talkId.length > 0 ? body.talkId : null;
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required." }, { status: 400, headers: rateLimit.headers });
  }

  const admin = createAdminClient();
  const active = await getActivePlan(user.id);

  // Resolve the expected session length AUTHORITATIVELY from the DB (never trust the client).
  // Fall back to a single TTL block when there is no talkId or the talk can't be read.
  let expectedSeconds = GRANT_TTL_SECONDS;
  if (talkId) {
    const { data: talk } = await admin
      .from("talks")
      .select("duration_minutes")
      .eq("id", talkId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (talk) expectedSeconds = (talk.duration_minutes ?? 1) * 60;
  }

  const { data: counter } = await admin
    .from("usage_counters")
    .select("cloud_reserved_seconds, cloud_confirmed_seconds")
    .eq("user_id", user.id)
    .eq("period_key", active.periodKey)
    .maybeSingle();

  const cloudReserved = counter?.cloud_reserved_seconds ?? 0;
  const cloudConfirmed = counter?.cloud_confirmed_seconds ?? 0;
  const posthog = getPostHogClient();

  if (!decideCloudAllowed({ capSeconds: active.capSeconds, cloudReserved, cloudConfirmed, expectedSeconds })) {
    posthog.capture({
      distinctId: user.id,
      event: "stt_engine_used",
      properties: { engine: "browser", reason: "cap_reached", plan: active.plan }
    });
    return NextResponse.json({ engine: "browser", reason: "cap_reached" }, { status: 200, headers: rateLimit.headers });
  }

  // Check the once-per-session guard BEFORE minting, but DON'T write the reservation yet:
  // the grant can still fail (502), and a reservation written here would never be released.
  const { data: existingSession } = await admin
    .from("stt_sessions")
    .select("id, user_id, status")
    .eq("id", sessionId)
    .maybeSingle();

  // Anti-rejeu : le sessionId vient du client, il ne prouve rien. Règle pure et
  // testée dans stt-metering (decideSessionReuse).
  const reuse = decideSessionReuse(existingSession, user.id);
  if (reuse.kind === "reject") {
    return NextResponse.json({ error: reuse.error }, { status: reuse.status, headers: rateLimit.headers });
  }

  const response = await fetch("https://api.deepgram.com/v1/auth/grant", {
    body: JSON.stringify({ ttl_seconds: GRANT_TTL_SECONDS }),
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json"
    },
    method: "POST"
  });
  const payload = (await response.json().catch(() => ({}))) as DeepgramGrantResponse;

  if (!response.ok || !payload.access_token) {
    // Grant failed: no reservation has been written, so nothing to release. No orphan charge.
    return NextResponse.json({ error: "Unable to create Deepgram token." }, { status: 502 });
  }

  // Grant succeeded — NOW reserve the FULL expected duration ONCE per session. On a re-mint of
  // the same sessionId the row already exists, so we leave the reservation and counter untouched
  // (the confirm step later releases reserved_seconds = expectedSeconds and books real seconds).
  if (reuse.kind === "fresh") {
    await admin.from("stt_sessions").insert({
      id: sessionId,
      user_id: user.id,
      period_key: active.periodKey,
      reserved_seconds: expectedSeconds,
      status: "reserved",
      engine: "cloud",
      updated_at: new Date().toISOString()
    });
    await admin.from("usage_counters").upsert(
      {
        user_id: user.id,
        period_key: active.periodKey,
        cloud_reserved_seconds: cloudReserved + expectedSeconds,
        cloud_confirmed_seconds: cloudConfirmed,
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_id,period_key" }
    );
  }
  posthog.capture({ distinctId: user.id, event: "stt_engine_used", properties: { engine: "cloud", plan: active.plan } });

  return NextResponse.json(
    {
      access_token: payload.access_token,
      expires_in: payload.expires_in
    },
    { headers: rateLimit.headers }
  );
}
