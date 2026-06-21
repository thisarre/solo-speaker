import type { AssistantFeatureSettings } from "@/modules/assistant/feature-registry";
import type { AssistantFeature } from "@/modules/assistant/types";
import type { Talk, TalkType } from "@/types/talk";

export type SpeakerRole = "pastor" | "conference_speaker" | "trainer" | "founder" | "speaker";

export type OnboardingProfile = {
  speaker_role: SpeakerRole;
  primary_talk_type: TalkType;
  onboarding_help_requested: boolean;
  onboarding_support_note: string;
};

export type OnboardingDashboardRecommendation = {
  id: string;
  title: string;
  message: string;
  actionLabel?: string;
  href?: string;
  tone?: "accent" | "help";
};

export type GuidedTalkSuggestion = {
  type: TalkType;
  roleLabel: string;
  titlePlaceholder: string;
  briefPlaceholder: string;
  message: string;
};

const roleTalkDefaults: Record<SpeakerRole, TalkType> = {
  pastor: "sermon",
  conference_speaker: "conference",
  trainer: "training",
  founder: "pitch",
  speaker: "conference"
};

const roleLabels: Record<SpeakerRole, string> = {
  pastor: "pasteur",
  conference_speaker: "conférencier",
  trainer: "formateur",
  founder: "fondateur",
  speaker: "speaker"
};

const guidedTalkByRole: Record<SpeakerRole, { briefPlaceholder: string; titlePlaceholder: string }> = {
  pastor: {
    titlePlaceholder: "Ex. Retrouver le courage quand la foi fatigue",
    briefPlaceholder: "Note le passage biblique, l'idée centrale, la tension vécue par l'audience et l'appel final."
  },
  conference_speaker: {
    titlePlaceholder: "Ex. Ce que personne ne voit avant une décision importante",
    briefPlaceholder: "Décris l'angle, le problème, l'idée forte, deux preuves et la conclusion que la salle doit retenir."
  },
  trainer: {
    titlePlaceholder: "Ex. Installer une méthode que l'équipe peut répéter",
    briefPlaceholder: "Liste l'objectif pédagogique, les étapes, l'exercice, les erreurs fréquentes et la consigne finale."
  },
  founder: {
    titlePlaceholder: "Ex. La vision qui transforme ce problème en mouvement",
    briefPlaceholder: "Résume le problème, la promesse, le produit, la preuve, l'appel à agir et le risque à lever."
  },
  speaker: {
    titlePlaceholder: "Ex. Une idée claire à transmettre en dix minutes",
    briefPlaceholder: "Décris l'objectif, l'audience, le contexte, le ton et le message principal."
  }
};

export function getOnboardingDefaultTalkType(profile?: OnboardingProfile | null): TalkType {
  if (!profile) return "conference";
  return profile.primary_talk_type || roleTalkDefaults[profile.speaker_role] || "conference";
}

export function getOnboardingAssistantFeatureSettings(profile?: OnboardingProfile | null): AssistantFeatureSettings {
  const extraEnabledFeatures: AssistantFeature[] = [];

  if (profile?.speaker_role === "pastor" || profile?.primary_talk_type === "sermon") {
    extraEnabledFeatures.push("suggest-bible");
  }

  return { extraEnabledFeatures };
}

export function getGuidedTalkSuggestion(profile?: OnboardingProfile | null): GuidedTalkSuggestion {
  const role = profile?.speaker_role ?? "speaker";
  const type = getOnboardingDefaultTalkType(profile);
  const guide = guidedTalkByRole[role];

  return {
    type,
    roleLabel: roleLabels[role],
    titlePlaceholder: guide.titlePlaceholder,
    briefPlaceholder: guide.briefPlaceholder,
    message: `Un premier brouillon guidé pour votre profil ${roleLabels[role]}.`
  };
}

export function buildOnboardingDashboardRecommendations(profile: OnboardingProfile | null | undefined, talks: Talk[]): OnboardingDashboardRecommendation[] {
  const recommendations: OnboardingDashboardRecommendation[] = [];
  const suggestion = getGuidedTalkSuggestion(profile);

  if (!talks.length) {
    recommendations.push({
      id: "guided-first-talk",
      title: "Premier talk guidé",
      message: `Démarrez avec un format ${suggestion.type} adapté à votre profil ${suggestion.roleLabel}.`,
      actionLabel: "Créer ce talk",
      href: "/talks/new?guided=1",
      tone: "accent"
    });
  }

  if (profile?.onboarding_help_requested) {
    recommendations.push({
      id: "onboarding-help",
      title: "Vous avez demandé de l'aide pour configurer votre studio",
      message: profile.onboarding_support_note
        ? `On garde votre note pour vous orienter: ${profile.onboarding_support_note}`
        : "Utilisez ce raccourci si vous voulez être guidé sur les réglages, les modules IA ou la préparation du premier talk.",
      actionLabel: "Demander de l'aide",
      href: "mailto:support@solo-speaker.app?subject=Besoin%20d'aide%20Solo%20Speaker",
      tone: "help"
    });
  }

  if (profile?.speaker_role === "pastor" && profile.primary_talk_type !== "sermon") {
    recommendations.push({
      id: "pastor-bible-module",
      title: "Module biblique prêt",
      message: "Les suggestions bibliques restent disponibles même si vous préparez un autre format.",
      actionLabel: "Voir les réglages",
      href: "/settings",
      tone: "accent"
    });
  }

  return recommendations.slice(0, 3);
}
