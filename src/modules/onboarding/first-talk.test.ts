import assert from "node:assert/strict";
import test from "node:test";
import { buildOnboardingFirstTalkDraft } from "./first-talk";

test("buildOnboardingFirstTalkDraft creates a localized first talk draft", () => {
  assert.deepEqual(buildOnboardingFirstTalkDraft({ locale: "fr", type: "conference", userId: "user_123" }), {
    section: {
      body: "",
      heading: "Première idée",
      position: 0
    },
    talk: {
      audience: "",
      duration_minutes: 10,
      language: "FR",
      title: "Ma première prise de parole",
      type: "conference",
      user_id: "user_123"
    }
  });
});

test("buildOnboardingFirstTalkDraft adapts English drafts", () => {
  const draft = buildOnboardingFirstTalkDraft({ locale: "en", type: "sermon", userId: "user_123" });

  assert.equal(draft.talk.language, "EN");
  assert.equal(draft.talk.title, "My first talk");
  assert.equal(draft.section.heading, "First idea");
});
