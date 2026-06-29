import { NextResponse, type NextRequest } from "next/server";
import { dispatchWorkflow } from "@/lib/github/repo";
import { postSlackMessage } from "@/lib/slack/client";
import { extractTaskText, isAuthorizedSlackUser, verifySlackSignature } from "@/modules/slack/verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SlackEvent = {
  type?: string;
  user?: string;
  text?: string;
  channel?: string;
  ts?: string;
  thread_ts?: string;
  bot_id?: string;
  subtype?: string;
};

type SlackEnvelope = {
  type?: string;
  challenge?: string;
  event?: SlackEvent;
};

const HELP = [
  "🤖 *Agent Dev — Solo Speaker*",
  "Mentionne-moi avec une tâche : `@bot corrige le bug du bouton de connexion`.",
  "Je code sur une branche, lance les tests et j'ouvre une *Pull Request* avec des boutons *Merger / Rejeter* ici même."
].join("\n");

function ok() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (
    !verifySlackSignature({
      signingSecret: process.env.SLACK_SIGNING_SECRET,
      timestamp: request.headers.get("x-slack-request-timestamp"),
      signature: request.headers.get("x-slack-signature"),
      rawBody
    })
  ) {
    console.warn("[slack] signature verification FAILED");
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let envelope: SlackEnvelope;
  try {
    envelope = JSON.parse(rawBody);
  } catch {
    return ok();
  }

  // Slack endpoint verification handshake.
  if (envelope.type === "url_verification") {
    return NextResponse.json({ challenge: envelope.challenge });
  }

  // Slack retries on slow/failed acks; don't re-dispatch the same task.
  if (request.headers.get("x-slack-retry-num")) return ok();

  const event = envelope.event;
  if (!event || (event.type !== "app_mention" && event.type !== "message")) return ok();
  if (event.bot_id || event.subtype) return ok(); // ignore bot / system messages

  if (!isAuthorizedSlackUser(event.user, process.env.SLACK_ALLOWED_USER_ID)) return ok();

  const channel = event.channel;
  const threadTs = event.thread_ts ?? event.ts;
  if (!channel) return ok();

  const prompt = extractTaskText(event.text);
  if (!prompt) {
    await postSlackMessage({ channel, text: HELP, thread_ts: threadTs });
    return ok();
  }

  const dispatched = await dispatchWorkflow("slack-code", { prompt, channel, thread_ts: threadTs ?? "", user: event.user ?? "" });
  if (!dispatched.ok) console.error("[slack] dispatch failed", dispatched);
  await postSlackMessage({
    channel,
    thread_ts: threadTs,
    text: dispatched.ok
      ? "🛠️ Tâche reçue. L'agent Dev travaille… je poste la PR ici dès que c'est prêt (quelques minutes)."
      : `❌ Lancement impossible : ${dispatched.error}`
  });

  return ok();
}
