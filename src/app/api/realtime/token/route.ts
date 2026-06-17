import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 });
  }

  const url = new URL(request.url);
  const language = url.searchParams.get("language") === "en" ? "en" : "fr";
  const model = process.env.OPENAI_REALTIME_TRANSCRIPTION_MODEL ?? "gpt-realtime-whisper";

  const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    body: JSON.stringify({
      session: {
        type: "transcription",
        audio: {
          input: {
            transcription: {
              delay: "minimal",
              language,
              model
            }
          }
        }
      }
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  const payload = (await response.json().catch(() => ({}))) as unknown;

  if (!response.ok) {
    return NextResponse.json({ error: "Unable to create realtime token.", details: payload }, { status: response.status });
  }

  return NextResponse.json(payload);
}
