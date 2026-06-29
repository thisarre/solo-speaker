// Orchestrator routing: decides whether a Slack message is an infra command or a
// dev task. Pure + ASCII (accents stripped before matching) so it is testable and
// passes the no-hardcoded-copy guard. Infra commands must be short/standalone so a
// dev task that merely mentions "deploiement" isn't misrouted.

export type SlackRoute =
  | { type: "help" }
  | { type: "dev"; prompt: string }
  | { type: "infra"; action: "status" | "deploy" | "rollback" | "logs" };

function normalize(text: string | undefined | null): string {
  return (text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function routeSlackCommand(rawText: string | undefined | null): SlackRoute {
  const original = (rawText ?? "").trim();
  if (!original) return { type: "help" };

  const t = normalize(original);

  if (/^(help|aide|commandes|\?)$/.test(t)) return { type: "help" };
  if (/^(etat|statut|status|sante|health)( (prod|site|du site|de la prod))?$/.test(t)) return { type: "infra", action: "status" };
  if (/^(deploie|deploy|deploiement|redeploie)( (la )?prod)?$/.test(t) || /^(mets?|met) en prod$/.test(t)) return { type: "infra", action: "deploy" };
  if (/^(rollback|revert)( (la )?prod)?$/.test(t) || /^(retour arriere|reviens en arriere|annule le (dernier )?deploiement)$/.test(t)) return { type: "infra", action: "rollback" };
  if (/^(logs?|journaux|journal)( (prod|du site))?$/.test(t)) return { type: "infra", action: "logs" };

  return { type: "dev", prompt: original };
}
