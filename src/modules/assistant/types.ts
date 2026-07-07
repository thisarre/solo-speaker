import type { TalkLanguage, TalkType } from "@/types/talk";

export type AssistantAction =
  | "outline"
  | "expand-section"
  | "oralize-section"
  | "shorten-section"
  | "predict-next"
  | "suggest-bible";
export type AssistantFeature = AssistantAction;

export type AssistantTalkContext = {
  title: string;
  type: TalkType;
  audience: string;
  objective: string;
  targetDurationMin: number;
  language: TalkLanguage;
};

export type AssistantSectionContext = {
  heading: string;
  body: string;
  targetDurationMin?: number;
};

export type AssistantRequest = {
  action: AssistantAction;
  talkId: string;
  talk: AssistantTalkContext;
  section?: AssistantSectionContext;
};

export type AssistantOutlineSection = {
  heading: string;
  body: string;
  targetDurationSec?: number;
};

export type AssistantGenerateResult =
  | {
      kind: "outline";
      sections: AssistantOutlineSection[];
    }
  | {
      kind: "section";
      heading: string;
      body: string;
    }
  | {
      kind: "suggestion";
      text: string;
    }
  | {
      kind: "bible";
      reference: string;
      text: string;
      reason: string;
    };

export type AssistantResponse =
  | {
      ok: true;
      result: AssistantGenerateResult;
    }
  | {
      ok: false;
      error: string;
    };

export type AssistantGenerateRequest = AssistantRequest;
export type AssistantGenerateResponse = AssistantResponse;
