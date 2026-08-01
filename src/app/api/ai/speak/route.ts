import { NextResponse, type NextRequest } from "next/server";
import { consumeAiRateLimit, getRequestIp } from "@/lib/rate-limit";
import { getPostHogClient } from "@/lib/posthog-server";
import { createClient } from "@/lib/supabase/server";
import { buildTtsUsageCapture } from "@/lib/usage-telemetry";
import { getTone, type ToneId } from "@/modules/voice-simulator/tones";

export const runtime = "nodejs";

const OPENAI_TTS_MODEL = process.env.OPENAI_TTS_MODEL || "tts-1";
const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech";
const MAX_CHARS = 4096; // tts-1 rejects anything longer.

/**
 * Usage reporting must never break playback: a telemetry outage is not a reason
 * to deny a user the audio they asked for.
 */
function reportTtsUsage(input: Parameters<typeof buildTtsUsageCapture>[0]) {
  try {
    getPostHogClient().capture(buildTtsUsageCapture(input));
  } catch {
    // Swallowed on purpose.
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let rateLimit;

  try {
    rateLimit = await consumeAiRateLimit({
      identity: {
        ip: getRequestIp(request.headers),
        userId: user.id
      },
      route: "speak"
    });
  } catch {
    return NextResponse.json({ error: "Rate limit protection unavailable" }, { status: 503 });
  }

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many voice requests. Try again shortly." }, { headers: rateLimit.headers, status: 429 });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "Text-to-speech not configured" }, { status: 503 });
  }

  let body: { text?: string; toneId?: string };
  try {
    body = await request.json() as { text?: string; toneId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim().slice(0, MAX_CHARS) : "";
  const toneId = (body.toneId ?? "confiant") as ToneId;

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const tone = getTone(toneId);

  const ttsResponse = await fetch(OPENAI_TTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "audio/mpeg"
    },
    body: JSON.stringify({
      model: OPENAI_TTS_MODEL,
      voice: tone.voiceId,
      input: text,
      speed: tone.speed,
      response_format: "mp3"
    })
  });

  reportTtsUsage({
    characters: text.length,
    distinctId: user.id,
    status: ttsResponse.status,
    toneId: tone.id
  });

  if (!ttsResponse.ok) {
    const raw = await ttsResponse.text();
    // Never surface the provider payload to the client: it leaks account state
    // (quota, billing links, request ids). Map it to a stable code the UI can translate.
    console.error(`[ai/speak] OpenAI ${ttsResponse.status} for voice ${tone.voiceId}: ${raw.slice(0, 500)}`);

    let providerCode = "";
    try {
      providerCode = (JSON.parse(raw) as { error?: { code?: string } }).error?.code ?? "";
    } catch {
      providerCode = "";
    }

    // insufficient_quota also arrives as 429; telling the user to retry shortly
    // would send them into a wall, so it maps to the quota code instead.
    const code = providerCode === "insufficient_quota"
      ? "quota_exceeded"
      : ttsResponse.status === 429
        ? "provider_busy"
        : "provider_error";

    return NextResponse.json(
      { code, error: "Voice synthesis unavailable" },
      { status: ttsResponse.status === 429 && providerCode !== "insufficient_quota" ? 429 : 502 }
    );
  }

  return new NextResponse(ttsResponse.body, {
    headers: {
      ...rateLimit.headers,
      "Content-Type": "audio/mpeg",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-store"
    }
  });
}
