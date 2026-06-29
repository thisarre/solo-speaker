import { NextResponse, type NextRequest } from "next/server";
import { isAuthorized, parseCommand } from "@/modules/telegram/commands";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TELEGRAM_API = "https://api.telegram.org";
const GITHUB_API = "https://api.github.com";

async function sendTelegram(chatId: number | string, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) return;
  try {
    await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true })
    });
  } catch {
    // best-effort; never throw inside the webhook
  }
}

async function dispatchCodingTask(prompt: string, chatId: number | string): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.GH_DISPATCH_TOKEN?.trim();
  const repo = process.env.GH_REPO?.trim();
  if (!token || !repo) return { ok: false, error: "GitHub non configuré" };
  try {
    const response = await fetch(`${GITHUB_API}/repos/${repo}/dispatches`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
        "user-agent": "solo-speaker-telegram-bot",
        "content-type": "application/json"
      },
      body: JSON.stringify({ event_type: "telegram-code", client_payload: { prompt, chat_id: String(chatId) } })
    });
    if (response.status === 204) return { ok: true };
    return { ok: false, error: `GitHub ${response.status}` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "réseau" };
  }
}

async function mergePullRequest(pr: number): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.GH_DISPATCH_TOKEN?.trim();
  const repo = process.env.GH_REPO?.trim();
  if (!token || !repo) return { ok: false, error: "GitHub non configuré" };
  try {
    const response = await fetch(`${GITHUB_API}/repos/${repo}/pulls/${pr}/merge`, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
        "user-agent": "solo-speaker-telegram-bot",
        "content-type": "application/json"
      },
      body: JSON.stringify({ merge_method: "squash" })
    });
    if (response.ok) return { ok: true };
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    return { ok: false, error: body.message || `GitHub ${response.status}` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "réseau" };
  }
}

const HELP = [
  "🤖 <b>Solo Speaker — agent de code</b>",
  "",
  "Envoie-moi une tâche en texte libre et je lance Claude Code en arrière-plan. Il code sur une branche, lance les tests et ouvre une <b>Pull Request</b>.",
  "",
  "Exemples :",
  "• <i>Corrige le bug du bouton de connexion sur mobile</i>",
  "• <i>Ajoute un mode sombre au tableau de bord</i>",
  "",
  "Commandes :",
  "• <code>/code &lt;tâche&gt;</code> — lancer une tâche",
  "• <code>/merge &lt;n°&gt;</code> — merger la PR n° (déclenche le déploiement)",
  "• <code>/status</code> — vérifier que le bot répond"
].join("\n");

export async function POST(request: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (!secret || request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: { message?: TelegramMessage; edited_message?: TelegramMessage };
  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const message = update.message ?? update.edited_message;
  const chatId = message?.chat?.id;
  if (!message || chatId === undefined) return NextResponse.json({ ok: true });

  // Allowlist: only the owner may drive the bot. Unknown senders are ignored.
  if (!isAuthorized(message.from?.id, process.env.TELEGRAM_OWNER_CHAT_ID)) {
    return NextResponse.json({ ok: true });
  }

  const command = parseCommand(message.text);

  if (command.type === "help" || command.type === "ignore") {
    await sendTelegram(chatId, HELP);
  } else if (command.type === "status") {
    await sendTelegram(chatId, "✅ Bot en ligne. Envoie une tâche pour lancer l'agent.");
  } else if (command.type === "merge") {
    const result = await mergePullRequest(command.pr);
    await sendTelegram(
      chatId,
      result.ok ? `✅ PR #${command.pr} mergée. Le déploiement se lance automatiquement.` : `❌ Merge impossible (PR #${command.pr}) : ${result.error}`
    );
  } else {
    const result = await dispatchCodingTask(command.prompt, chatId);
    await sendTelegram(
      chatId,
      result.ok
        ? "🛠️ Tâche reçue. L'agent travaille… je t'envoie le lien de la PR dès que c'est prêt (quelques minutes)."
        : `❌ Lancement impossible : ${result.error}`
    );
  }

  return NextResponse.json({ ok: true });
}

type TelegramMessage = {
  text?: string;
  chat?: { id: number | string };
  from?: { id: number | string };
};
