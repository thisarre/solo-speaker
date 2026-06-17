import assert from "node:assert/strict";
import test from "node:test";
import { getEnabledAssistantFeatures } from "./feature-registry";

test("bible suggestions are enabled by default for sermons only", () => {
  assert.equal(getEnabledAssistantFeatures("sermon").has("suggest-bible"), true);
  assert.equal(getEnabledAssistantFeatures("conference").has("suggest-bible"), false);
});

test("optional assistant settings can enable specialized features for other talk types", () => {
  const enabled = getEnabledAssistantFeatures("conference", {
    extraEnabledFeatures: ["suggest-bible"]
  });

  assert.equal(enabled.has("suggest-bible"), true);
});
