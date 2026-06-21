import type { AssistantAction, AssistantGenerateResult } from "@/modules/assistant/types";

export type AssistantPrimaryApplyMode = "append" | "replace";

export function getAssistantPrimaryApplyMode(action: AssistantAction, result: AssistantGenerateResult): AssistantPrimaryApplyMode {
  if (result.kind !== "section") return "append";
  return action === "expand-section" || action === "oralize-section" || action === "shorten-section" ? "replace" : "append";
}

export function getAssistantPrimaryApplyLabel(action: AssistantAction, result: AssistantGenerateResult) {
  if (result.kind === "outline") return "Ajouter les sections";
  if (result.kind === "bible") return "Insérer le verset";
  if (getAssistantPrimaryApplyMode(action, result) === "replace") return "Remplacer la section";
  return "Ajouter à la suite";
}
