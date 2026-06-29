import assert from "node:assert/strict";
import test from "node:test";
import { routeSlackCommand } from "./router";

test("routeSlackCommand detects infra status", () => {
  assert.deepEqual(routeSlackCommand("état prod"), { type: "infra", action: "status" });
  assert.deepEqual(routeSlackCommand("status"), { type: "infra", action: "status" });
  assert.deepEqual(routeSlackCommand("santé du site"), { type: "infra", action: "status" });
});

test("routeSlackCommand detects deploy and rollback", () => {
  assert.deepEqual(routeSlackCommand("déploie"), { type: "infra", action: "deploy" });
  assert.deepEqual(routeSlackCommand("deploy prod"), { type: "infra", action: "deploy" });
  assert.deepEqual(routeSlackCommand("mets en prod"), { type: "infra", action: "deploy" });
  assert.deepEqual(routeSlackCommand("rollback"), { type: "infra", action: "rollback" });
  assert.deepEqual(routeSlackCommand("reviens en arrière"), { type: "infra", action: "rollback" });
});

test("routeSlackCommand detects logs and help", () => {
  assert.deepEqual(routeSlackCommand("logs"), { type: "infra", action: "logs" });
  assert.deepEqual(routeSlackCommand("journaux"), { type: "infra", action: "logs" });
  assert.deepEqual(routeSlackCommand("aide"), { type: "help" });
  assert.deepEqual(routeSlackCommand(""), { type: "help" });
});

test("routeSlackCommand detects marketing analytics", () => {
  assert.deepEqual(routeSlackCommand("analyse le funnel"), { type: "marketing", question: "analyse le funnel" });
  assert.deepEqual(routeSlackCommand("idées d'A/B test"), { type: "marketing", question: "idées d'A/B test" });
  assert.deepEqual(routeSlackCommand("montre les inscriptions de la semaine"), { type: "marketing", question: "montre les inscriptions de la semaine" });
  assert.equal(routeSlackCommand("combien de conversions ce mois-ci").type, "marketing");
  // "améliore la conversion" is a build task, not an analysis → dev
  assert.equal(routeSlackCommand("améliore la conversion du bouton signup").type, "dev");
});

test("routeSlackCommand routes dev tasks and splits feature vs fix", () => {
  // fixes go straight Dev -> QA (no infra false positive on "déploiement")
  assert.deepEqual(routeSlackCommand("corrige le bug dans le déploiement automatique"), {
    type: "dev",
    prompt: "corrige le bug dans le déploiement automatique",
    track: "fix"
  });
  assert.deepEqual(routeSlackCommand("fix: typo sur la page tarifs"), {
    type: "dev",
    prompt: "fix: typo sur la page tarifs",
    track: "fix"
  });
  // features run the full cycle (Marketing -> PO -> Dev -> QA)
  assert.deepEqual(routeSlackCommand("ajoute un bouton de partage public sur la page talk"), {
    type: "dev",
    prompt: "ajoute un bouton de partage public sur la page talk",
    track: "feature"
  });
  assert.deepEqual(routeSlackCommand("améliore la page tarifs"), {
    type: "dev",
    prompt: "améliore la page tarifs",
    track: "feature"
  });
  // "ajoute des logs au module de paiement" is a dev task, not the infra logs command
  assert.equal(routeSlackCommand("ajoute des logs au module de paiement").type, "dev");
});
