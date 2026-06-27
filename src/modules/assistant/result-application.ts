import type { AssistantAction, AssistantGenerateResult } from "@/modules/assistant/types";
import { getMessages } from "@/i18n/messages";

export type AssistantPrimaryApplyMode = "append" | "replace";

export function getAssistantPrimaryApplyMode(action: AssistantAction, result: AssistantGenerateResult): AssistantPrimaryApplyMode {
  if (result.kind !== "section") return "append";
  return action === "expand-section" || action === "oralize-section" || action === "shorten-section" ? "replace" : "append";
}

export function getAssistantPrimaryApplyLabel(action: AssistantAction, result: AssistantGenerateResult) {
  const copy = getMessages("fr").assistant;
  if (result.kind === "outline") return copy.addSections;
  if (result.kind === "bible") return copy.insertVerseLabel;
  if (getAssistantPrimaryApplyMode(action, result) === "replace") return copy.replaceSectionLabel;
  return copy.appendLabel;
}
