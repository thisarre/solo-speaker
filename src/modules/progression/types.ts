import type { Talk, TalkSection, TalkStatus, TalkType } from "@/types/talk";

export type ProgressionScoreLabel = "À structurer" | "En préparation" | "Presque prêt" | "Prêt à présenter";
export type DurationStatus = "too_short" | "good" | "too_long";

export type ProgressionMetric = {
  id: string;
  label: string;
  value: string | number;
  detail: string;
};

export type TalkReadiness = {
  talk: Talk;
  score: number;
  label: ProgressionScoreLabel;
  missing: string[];
  totalWords: number;
  estimatedMinutes: number;
  durationStatus: DurationStatus;
  isArchived: boolean;
  isReady: boolean;
};

export type ProgressionRecommendation = {
  id: string;
  message: string;
  actionLabel?: string;
  href?: string;
};

export type StatusDistribution = {
  status: TalkStatus;
  label: string;
  count: number;
  percent: number;
};

export type TypeDistribution = {
  type: TalkType;
  label: string;
  count: number;
  percent: number;
};

export type GlobalProgressionReport = {
  score: number;
  label: ProgressionScoreLabel;
  metrics: ProgressionMetric[];
  activeTalks: number;
  readyTalks: number;
  draftTalks: number;
  archivedTalks: number;
  totalPreparedMinutes: number;
  totalSections: number;
  readiness: TalkReadiness[];
  toFinish: TalkReadiness[];
  readyToPresent: TalkReadiness[];
  statusDistribution: StatusDistribution[];
  typeDistribution: TypeDistribution[];
  recommendations: ProgressionRecommendation[];
};

export type ProgressionTalkInput = Pick<Talk, "id" | "title" | "type" | "status" | "audience" | "durationMinutes" | "sections">;
export type ProgressionSectionInput = Pick<TalkSection, "heading" | "body" | "position">;
