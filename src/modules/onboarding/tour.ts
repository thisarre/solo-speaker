export type OnboardingTourStep = {
  id: "dashboard" | "new-talk" | "editor" | "prompter" | "settings";
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  actionLabel: string;
  target: string;
  instruction: string;
};

export const onboardingTourStorageKey = "solo-speaker.guided-onboarding.v1";
export const onboardingTourProgressKey = "solo-speaker.guided-onboarding-progress.v1";
export const onboardingTourRestartEvent = "solo-speaker:restart-guided-onboarding";

export const onboardingTourSteps: OnboardingTourStep[] = [
  {
    id: "dashboard",
    eyebrow: "Étape 1",
    title: "Votre tableau de bord",
    body: "Commencez ici pour reprendre un talk, voir les recommandations et lancer la prochaine action utile.",
    href: "/dashboard",
    actionLabel: "Voir le dashboard",
    target: "[data-tour='dashboard-home']",
    instruction: "Regardez ce bloc: c'est votre point de départ quotidien."
  },
  {
    id: "new-talk",
    eyebrow: "Étape 2",
    title: "Créer le premier talk",
    body: "Posez un titre, choisissez le format, ajoutez un brief ou dictez une idée avec le mémo vocal.",
    href: "/talks/new?guided=1",
    actionLabel: "Créer un talk guidé",
    target: "[data-tour='create-talk']",
    instruction: "Cliquez ici pour démarrer un brouillon guidé."
  },
  {
    id: "editor",
    eyebrow: "Étape 3",
    title: "Construire le texte",
    body: "Dans l'éditeur, travaillez section par section. L'assistant peut développer, oraliser ou raccourcir le bloc actif.",
    href: "/talks",
    actionLabel: "Voir mes talks",
    target: "[data-tour='talks-list']",
    instruction: "Ouvrez un talk pour entrer dans l'éditeur."
  },
  {
    id: "prompter",
    eyebrow: "Étape 4",
    title: "Répéter en prompteur",
    body: "Quand le texte est prêt, ouvrez le mode prompteur pour tester le rythme, la lisibilité et le suivi vocal.",
    href: "/talks",
    actionLabel: "Choisir un talk",
    target: "[data-tour='prompter-action']",
    instruction: "Depuis un talk, utilisez Répéter pour passer en prompteur."
  },
  {
    id: "settings",
    eyebrow: "Étape 5",
    title: "Ajuster le studio",
    body: "Réglez les modules IA, le mode clair/sombre, la taille du texte et les préférences de suivi vocal.",
    href: "/settings",
    actionLabel: "Ouvrir les réglages",
    target: "[data-tour='settings']",
    instruction: "Terminez ici pour adapter le studio à votre manière de parler."
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
  if (pathname.startsWith("/talks/new")) return 1;
  if (pathname === "/talks" || pathname.startsWith("/talks/")) return Math.max(2, fallbackIndex);
  if (pathname.startsWith("/settings")) return 4;
  if (pathname.startsWith("/dashboard")) return 0;
  return getOnboardingTourProgress(fallbackIndex);
}
