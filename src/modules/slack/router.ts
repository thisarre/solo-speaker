// Orchestrator routing: decides whether a Slack message is an infra command, a
// quick fix (Dev -> QA) or a feature (Marketing -> PO -> Dev -> QA). Pure + ASCII
// (accents stripped before matching) so it is testable and passes the
// no-hardcoded-copy guard. Infra commands must be short/standalone so a dev task
// that merely mentions "deploiement" isn't misrouted.

export type SlackRoute =
  | { type: "help" }
  | { type: "dev"; prompt: string; track: "feature" | "fix" }
  | { type: "infra"; action: "status" | "deploy" | "rollback" | "logs" }
  | { type: "marketing"; question: string };

// A dedicated channel pins the agent: everything said in #agent-dev is a dev
// task, everything in #agent-infra an infra command, etc. "auto" keeps keyword
// routing (the shared #agents channel and any other channel).
export type ChannelRole = "auto" | "dev" | "infra" | "marketing";

export function resolveChannelRole(
  channelId: string | undefined | null,
  env: { devChannel?: string | null; infraChannel?: string | null; marketingChannel?: string | null }
): ChannelRole {
  if (!channelId) return "auto";
  if (env.devChannel && channelId === env.devChannel) return "dev";
  if (env.infraChannel && channelId === env.infraChannel) return "infra";
  if (env.marketingChannel && channelId === env.marketingChannel) return "marketing";
  return "auto";
}

function normalize(text: string | undefined | null): string {
  return (text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

const FIX_PATTERN = /(^|\b)(fix|hotfix|corrige|corriger|repare|reparer|bug|typo|regression)(\b|:)/;

export function routeSlackCommand(rawText: string | undefined | null, role: ChannelRole = "auto"): SlackRoute {
  const original = (rawText ?? "").trim();
  if (!original) return { type: "help" };

  const t = normalize(original);

  if (/^(help|aide|commandes|\?)$/.test(t)) return { type: "help" };

  if (role === "dev") {
    return { type: "dev", prompt: original, track: FIX_PATTERN.test(t) ? "fix" : "feature" };
  }

  if (role === "marketing") {
    return { type: "marketing", question: original };
  }

  if (role === "infra") {
    // In the dedicated infra channel intent can be phrased loosely ("est-ce que
    // la mise en ligne a fonctionné ?"), so match keywords anywhere. Status is
    // checked first: a question about a deploy is a status request, not a deploy.
    if (/(etat|statut|status|sante|health|fonctionne|marche|en ligne|up|ok \?)/.test(t)) return { type: "infra", action: "status" };
    if (/(rollback|revert|retour arriere|reviens en arriere|annule)/.test(t)) return { type: "infra", action: "rollback" };
    if (/(deploie|deploy|deploiement|redeploie|met[s]? en prod)/.test(t)) return { type: "infra", action: "deploy" };
    if (/(logs?|journaux|journal)/.test(t)) return { type: "infra", action: "logs" };
    return { type: "help" };
  }

  if (/^(etat|statut|status|sante|health)( (prod|site|du site|de la prod))?$/.test(t)) return { type: "infra", action: "status" };
  if (/^(deploie|deploy|deploiement|redeploie)( (la )?prod)?$/.test(t) || /^(mets?|met) en prod$/.test(t)) return { type: "infra", action: "deploy" };
  if (/^(rollback|revert)( (la )?prod)?$/.test(t) || /^(retour arriere|reviens en arriere|annule le (dernier )?deploiement)$/.test(t)) return { type: "infra", action: "rollback" };
  if (/^(logs?|journaux|journal)( (prod|du site))?$/.test(t)) return { type: "infra", action: "logs" };

  // The deploy-status question that used to fall through to the feature
  // pipeline (a check-verb + deploy-noun + worked-verb combination). Requires
  // the ask-verb so a dev task mentioning the site working stays a dev task.
  const askVerb = /\b(dis|dire|verifie|verifier|regarde|check|confirme|confirmer|savoir si)\b|est ?-?ce que/.test(t);
  const deployNoun = /\b(mise en ligne|deploiement|deploy|site|prod)\b/.test(t);
  const workedVerb = /\b(fonctionne|marche|reussi|passe|ok|en ligne)/.test(t);
  if (askVerb && deployNoun && workedVerb) {
    return { type: "infra", action: "status" };
  }

  // Marketing analytics: an analysis verb + a marketing noun (so "améliore la
  // conversion" stays a dev task, while "analyse la conversion" is marketing).
  const analysisVerb = /\b(analyse|analyser|montre|affiche|donne|rapport|combien|quel|quels|quelle|propose)\b/.test(t);
  const marketingNoun = /\b(funnels?|tunnels?|conversions?|retention|churn|acquisitions?|trafic|analytics|posthog|inscriptions?|signups?|metriques?|kpis?)\b|a\/?b/.test(t);
  if ((analysisVerb && marketingNoun) || /^(funnel|metriques|analytics|kpi)$/.test(t) || /idees? (d['e] ?)?(a\/?b|ab)/.test(t)) {
    return { type: "marketing", question: original };
  }

  // A quick fix skips Marketing/PO and goes straight Dev -> QA.
  return { type: "dev", prompt: original, track: FIX_PATTERN.test(t) ? "fix" : "feature" };
}
