import { NextResponse, type NextRequest } from "next/server";
import { consumeAiRateLimit, getRequestIp } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { getTone, type ToneId } from "@/modules/voice-simulator/tones";

export const runtime = "nodejs";

const ELEVENLABS_MODEL = "eleven_multilingual_v2";
const MAX_CHARS = 5000;

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

  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "ElevenLabs not configured" }, { status: 503 });
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

  const elevenResponse = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${tone.voiceId}/stream`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg"
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_MODEL,
        voice_settings: {
          stability: tone.stability,
          similarity_boost: tone.similarityBoost,
          style: tone.style,
          use_speaker_boost: tone.speakerBoost
        }
      })
    }
  );

  if (!elevenResponse.ok) {
    const err = await elevenResponse.text();
    return NextResponse.json({ error: err || "ElevenLabs error" }, { status: elevenResponse.status });
  }

  return new NextResponse(elevenResponse.body, {
    headers: {
      ...rateLimit.headers,
      "Content-Type": "audio/mpeg",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-store"
    }
  });
}
