import assert from "node:assert/strict";
import test from "node:test";
import { getAssistantPrimaryApplyLabel, getAssistantPrimaryApplyMode } from "./result-application";

const sectionResult = {
  kind: "section",
  heading: "Introduction",
  body: "Texte plus oral."
} as const;

test("oralize section replaces the active section by default", () => {
  assert.equal(getAssistantPrimaryApplyMode("oralize-section", sectionResult), "replace");
  assert.equal(getAssistantPrimaryApplyLabel("oralize-section", sectionResult), "Remplacer la section");
});

test("outline results are still appended as new sections", () => {
  assert.equal(getAssistantPrimaryApplyMode("outline", { kind: "outline", sections: [] }), "append");
  assert.equal(getAssistantPrimaryApplyLabel("outline", { kind: "outline", sections: [] }), "Ajouter les sections");
});
