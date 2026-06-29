import { NextResponse, type NextRequest } from "next/server";
import { dispatchWorkflow } from "@/lib/github/repo";
import { postSlackMessage } from "@/lib/slack/client";
import { extractTaskText, isAuthorizedSlackUser, verifySlackSignature } from "@/modules/slack/verify";
import { routeSlackCommand } from "@/modules/slack/router";

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
  "🤖 *Solo Speaker — agents*",
  "",
  "*Dev* — mentionne-moi avec une tâche → je code, teste et j'ouvre une *Pull Request* avec boutons *Merger / Rejeter*.",
  "_ex : `@bot corrige le bug du bouton de connexion`_",
  "",
  "*Infra* :",
  "• `état prod` — santé du site + erreurs",
  "• `déploie` — redéployer la prod (avec confirmation)",
  "• `rollback` — revenir au dernier état (avec confirmation)",
  "• `logs` — dernières lignes de logs",
  "",
  "*Marketing* (résultats dans #analytics) :",
  "• `analyse le funnel` — données PostHog + insights",
  "• `idées d'A/B test` — propositions d'expériences"
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

  const route = routeSlackCommand(extractTaskText(event.text));

  if (route.type === "help") {
    await postSlackMessage({ channel, text: HELP, thread_ts: threadTs });
    return ok();
  }

  if (route.type === "infra") {
    if (route.action === "status" || route.action === "logs") {
      const dispatched = await dispatchWorkflow("slack-infra", { action: route.action, channel, thread_ts: threadTs ?? "" });
      await postSlackMessage({
        channel,
        thread_ts: threadTs,
        text: dispatched.ok ? "🔧 Demande envoyée à l'agent Infra…" : `❌ Lancement impossible : ${dispatched.error}`
      });
    } else {
      const label = route.action === "deploy" ? "le *déploiement* en production" : "un *rollback* (revert du dernier changement) puis redéploiement";
      await postSlackMessage({
        channel,
        thread_ts: threadTs,
        text: `⚠️ Confirmer ${label} ?`,
        blocks: [
          { type: "section", text: { type: "mrkdwn", text: `⚠️ Confirmer ${label} ?` } },
          {
            type: "actions",
            elements: [
              { type: "button", text: { type: "plain_text", text: "Confirmer" }, style: "primary", action_id: "infra_confirm", value: route.action },
              { type: "button", text: { type: "plain_text", text: "Annuler" }, style: "danger", action_id: "infra_cancel", value: route.action }
            ]
          }
        ]
      });
    }
    return ok();
  }

  if (route.type === "marketing") {
    const dispatched = await dispatchWorkflow("slack-marketing", { question: route.question, channel, thread_ts: threadTs ?? "" });
    const analyticsRef = process.env.SLACK_ANALYTICS_CHANNEL ? `<#${process.env.SLACK_ANALYTICS_CHANNEL}>` : "#analytics";
    await postSlackMessage({
      channel,
      thread_ts: threadTs,
      text: dispatched.ok ? `📊 J'analyse les données PostHog… le résultat arrive dans ${analyticsRef}.` : `❌ Lancement impossible : ${dispatched.error}`
    });
    return ok();
  }

  if (route.track === "feature") {
    const dispatched = await dispatchWorkflow("slack-refine", { prompt: route.prompt, channel, thread_ts: threadTs ?? "", user: event.user ?? "" });
    if (!dispatched.ok) console.error("[slack] dispatch failed", dispatched);
    await postSlackMessage({
      channel,
      thread_ts: threadTs,
      text: dispatched.ok
        ? "📋 Reçu. Les agents *Marketing* + *PO* cadrent la demande… je reviens avec un spec à valider."
        : `❌ Lancement impossible : ${dispatched.error}`
    });
    return ok();
  }

  // quick fix → Dev directly
  const dispatched = await dispatchWorkflow("slack-code", { prompt: route.prompt, channel, thread_ts: threadTs ?? "", user: event.user ?? "" });
  if (!dispatched.ok) console.error("[slack] dispatch failed", dispatched);
  await postSlackMessage({
    channel,
    thread_ts: threadTs,
    text: dispatched.ok
      ? "🛠️ Correctif reçu. L'agent Dev travaille… PR + QA à suivre."
      : `❌ Lancement impossible : ${dispatched.error}`
  });

  return ok();
}
