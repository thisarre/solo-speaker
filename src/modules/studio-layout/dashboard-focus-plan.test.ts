import assert from "node:assert/strict";
import test from "node:test";
import { buildDashboardFocusPlan } from "./dashboard-focus-plan";
import type { Talk } from "@/types/talk";

const baseTalk: Talk = {
  id: "talk-1",
  title: "Construire avec confiance",
  type: "conference",
  status: "draft",
  audience: "Équipe produit",
  durationMinutes: 12,
  language: "FR",
  updatedAtLabel: "Mis à jour aujourd'hui",
  sections: [
    { id: "intro", heading: "Intro", body: "Accroche", position: 0 },
    { id: "body", heading: "Corps", body: "Développement", position: 1 }
  ],
  parentTalkId: null,
  shareToken: null
};

test("buildDashboardFocusPlan guides an empty studio toward creating a first talk", () => {
  const plan = buildDashboardFocusPlan([]);

  assert.equal(plan.label, "Démarrage");
  assert.equal(plan.title, "Créer la première prise de parole");
  assert.equal(plan.href, "/talks/new?guided=1");
  assert.equal(plan.status, "À lancer");
});

test("buildDashboardFocusPlan prioritizes finishing drafts before rehearsing ready talks", () => {
  const plan = buildDashboardFocusPlan([
    { ...baseTalk, id: "ready", status: "ready", title: "Démo prête" },
    { ...baseTalk, id: "draft", status: "draft", title: "Talk à finaliser", sections: [] }
  ]);

  assert.equal(plan.label, "Focus");
  assert.equal(plan.title, "Finaliser Talk à finaliser");
  assert.equal(plan.href, "/talks/draft");
  assert.equal(plan.status, "À clarifier");
});

test("buildDashboardFocusPlan sends a ready studio into rehearsal", () => {
  const plan = buildDashboardFocusPlan([{ ...baseTalk, status: "ready" }]);

  assert.equal(plan.label, "Répétition");
  assert.equal(plan.title, "Répéter Construire avec confiance");
  assert.equal(plan.href, "/talks/talk-1/speak");
  assert.equal(plan.status, "Prêt");
});
