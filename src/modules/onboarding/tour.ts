export type OnboardingTourStep = {
  id: "dashboard" | "new-talk" | "editor" | "prompter" | "settings";
  href: string;
  target: string;
};

export const onboardingTourStorageKey = "solo-speaker.guided-onboarding.v1";
export const onboardingTourProgressKey = "solo-speaker.guided-onboarding-progress.v1";
export const onboardingTourRestartEvent = "solo-speaker:restart-guided-onboarding";

export const onboardingTourSteps: OnboardingTourStep[] = [
  {
    id: "new-talk",
    href: "/talks/new?guided=1&welcome=1",
    target: "[data-tour='create-talk']"
  },
  {
    id: "editor",
    href: "/talks",
    target: "[data-tour='talks-list']"
  },
  {
    id: "prompter",
    href: "/talks",
    target: "[data-tour='prompter-action']"
  },
  {
    id: "dashboard",
    href: "/dashboard",
    target: "[data-tour='dashboard-home']"
  },
  {
    id: "settings",
    href: "/settings",
    target: "[data-tour='settings']"
  }
];

export function getOnboardingTourProgress(index: number) {
  if (!Number.isFinite(index)) return 0;
  return Math.min(Math.max(0, Math.round(index)), onboardingTourSteps.length - 1);
}

export function getRestartedOnboardingTourState() {
  return {
    completed: false,
    stepIndex: 0
  };
}

export function resolveOnboardingTourStepHref(step: OnboardingTourStep, context: { latestTalkId?: string | null } = {}) {
  if (step.id === "editor" && context.latestTalkId) return `/talks/${context.latestTalkId}`;
  if (step.id === "prompter" && context.latestTalkId) return `/talks/${context.latestTalkId}/speak`;
  if ((step.id === "editor" || step.id === "prompter") && !context.latestTalkId) return "/talks/new?guided=1";
  return step.href;
}

export function getStepIndexForPath(pathname: string, fallbackIndex: number) {
  if (pathname.startsWith("/talks/new")) return 0;
  if (pathname === "/talks" || pathname.startsWith("/talks/")) return Math.max(1, fallbackIndex);
  if (pathname.startsWith("/settings")) return 4;
  if (pathname.startsWith("/dashboard")) return 3;
  return getOnboardingTourProgress(fallbackIndex);
}
