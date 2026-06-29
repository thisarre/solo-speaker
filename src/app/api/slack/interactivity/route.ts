import { NextResponse, type NextRequest } from "next/server";
import { closePullRequest, dispatchWorkflow, mergePullRequest } from "@/lib/github/repo";
import { respondToSlackAction } from "@/lib/slack/client";
import { isAuthorizedSlackUser, verifySlackSignature } from "@/modules/slack/verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SlackAction = { action_id?: string; value?: string };
type SlackInteraction = {
  type?: string;
  user?: { id?: string };
  response_url?: string;
  actions?: SlackAction[];
  channel?: { id?: string };
  message?: { ts?: string; thread_ts?: string };
};

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
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const encoded = new URLSearchParams(rawBody).get("payload");
  if (!encoded) return NextResponse.json({ ok: true });

  let payload: SlackInteraction;
  try {
    payload = JSON.parse(encoded);
  } catch {
    return NextResponse.json({ ok: true });
  }

  if (!isAuthorizedSlackUser(payload.user?.id, process.env.SLACK_ALLOWED_USER_ID)) {
    return NextResponse.json({ ok: true });
  }

  const action = payload.actions?.[0];
  const responseUrl = payload.response_url;

  if (action && responseUrl) {
    if (action.action_id === "merge_pr") {
      const pr = Number(action.value);
      const result = await mergePullRequest(pr);
      await respondToSlackAction(responseUrl, result.ok ? `✅ PR #${pr} mergée. Le déploiement se lance.` : `❌ Merge impossible (PR #${pr}) : ${result.error}`);
    } else if (action.action_id === "reject_pr") {
      const [prRaw, branch] = String(action.value ?? "").split(":");
      const pr = Number(prRaw);
      const result = await closePullRequest(pr, branch);
      await respondToSlackAction(responseUrl, result.ok ? `🗑️ PR #${pr} rejetée et branche supprimée.` : `❌ Rejet impossible (PR #${pr}) : ${result.error}`);
    } else if (action.action_id === "infra_confirm") {
      const infraAction = String(action.value ?? "");
      const dispatched = await dispatchWorkflow("slack-infra", {
        action: infraAction,
        channel: payload.channel?.id ?? "",
        thread_ts: payload.message?.thread_ts ?? payload.message?.ts ?? ""
      });
      const label = infraAction === "deploy" ? "Déploiement" : "Rollback";
      await respondToSlackAction(responseUrl, dispatched.ok ? `🔧 ${label} lancé par l'agent Infra…` : `❌ Lancement impossible : ${dispatched.error}`);
    } else if (action.action_id === "infra_cancel") {
      await respondToSlackAction(responseUrl, "Annulé.");
    } else if (action.action_id === "spec_approve") {
      const spec = String(action.value ?? "");
      const dispatched = await dispatchWorkflow("slack-code", {
        prompt: spec,
        channel: payload.channel?.id ?? "",
        thread_ts: payload.message?.thread_ts ?? payload.message?.ts ?? "",
        user: payload.user?.id ?? ""
      });
      await respondToSlackAction(responseUrl, dispatched.ok ? "✅ Spec validé. L'agent *Dev* code… PR + QA à suivre." : `❌ Lancement impossible : ${dispatched.error}`);
    } else if (action.action_id === "spec_reject") {
      await respondToSlackAction(responseUrl, "🚫 Spec rejeté. Reformule la demande si besoin.");
    }
  }

  return NextResponse.json({ ok: true });
}
