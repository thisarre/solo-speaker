import { NextResponse, type NextRequest } from "next/server";
import { consumeAiRateLimit, getRequestIp } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

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

  const response = await fetch("https://api.deepgram.com/v1/auth/grant", {
    body: JSON.stringify({ ttl_seconds: 60 }),
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json"
    },
    method: "POST"
  });
  const payload = (await response.json().catch(() => ({}))) as DeepgramGrantResponse;

  if (!response.ok || !payload.access_token) {
    return NextResponse.json({ error: "Unable to create Deepgram token." }, { status: 502 });
  }

  return NextResponse.json(
    {
      access_token: payload.access_token,
      expires_in: payload.expires_in
    },
    { headers: rateLimit.headers }
  );
}
