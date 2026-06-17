import type { Talk } from "@/types/talk";

export type SpeakingCue = {
  kind: "pause";
  seconds: number;
  label: string;
};

export type SpeakingTextSegment =
  | { kind: "text"; text: string }
  | { kind: "cue"; cue: SpeakingCue };

export type SpeakingItem = {
  id: string;
  sectionId: string;
  sectionIndex: number;
  kind: "heading" | "body";
  text: string;
  segments: SpeakingTextSegment[];
  estimatedSeconds: number;
};

export type SpeakingSettings = {
  speed: number;
  fontSize: number;
};

export type ReadingPosition = "high" | "center" | "low";

export type SpeakingModeProps = {
  talk: Talk;
};
