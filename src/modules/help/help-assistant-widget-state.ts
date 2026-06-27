export type HelpAssistantActivity = "ready" | "listening" | "thinking";

type HelpAssistantWidgetStateInput = {
  hasUserMessage: boolean;
  isOpen: boolean;
  isPending: boolean;
};

type HelpAssistantWidgetState = {
  activity: HelpAssistantActivity;
  shouldShowQuickQuestions: boolean;
  shouldShowTyping: boolean;
};

export function getHelpAssistantWidgetState({ hasUserMessage, isOpen, isPending }: HelpAssistantWidgetStateInput): HelpAssistantWidgetState {
  if (!isOpen) {
    return {
      activity: "ready",
      shouldShowQuickQuestions: false,
      shouldShowTyping: false
    };
  }

  if (isPending) {
    return {
      activity: "thinking",
      shouldShowQuickQuestions: false,
      shouldShowTyping: true
    };
  }

  return {
    activity: "listening",
    shouldShowQuickQuestions: !hasUserMessage,
    shouldShowTyping: false
  };
}
