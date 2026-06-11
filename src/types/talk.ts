export type TalkType = "sermon" | "conference" | "training" | "pitch" | "speech";

export type TalkStatus = "draft" | "ready" | "archived";

export type TalkSection = {
  id: string;
  heading: string;
  body: string;
  position: number;
  minutes?: number;
};

export type Talk = {
  id: string;
  title: string;
  type: TalkType;
  status: TalkStatus;
  audience: string;
  durationMinutes: number;
  language: "FR" | "EN";
  updatedAtLabel: string;
  sections: TalkSection[];
};

export const talkTypeLabels: Record<TalkType, string> = {
  sermon: "Sermon",
  conference: "Conférence",
  training: "Training",
  pitch: "Pitch",
  speech: "Speech"
};

export const talkStatusLabels: Record<TalkStatus, string> = {
  draft: "Brouillon",
  ready: "Prêt",
  archived: "Archivé"
};
