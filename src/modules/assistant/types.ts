import type { TalkType } from "@/types/talk";

export type AssistantAction = "outline" | "expand-section" | "oralize-section" | "shorten-section";

export type AssistantTalkContext = {
  title: string;
  type: TalkType;
  audience: string;
  objective: string;
  durationMinutes: number;
  language: "FR" | "EN";
};

export type AssistantSectionContext = {
  heading: string;
  body: string;
};

export type AssistantGenerateRequest = {
  action: AssistantAction;
  talkId: string;
  talk: AssistantTalkContext;
  section?: AssistantSectionContext;
};

export type AssistantOutlineSection = {
  heading: string;
  body: string;
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
    };

export type AssistantGenerateResponse =
  | {
      ok: true;
      result: AssistantGenerateResult;
    }
  | {
      ok: false;
      error: string;
    };
