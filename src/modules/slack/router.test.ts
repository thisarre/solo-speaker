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

test("routeSlackCommand treats real tasks as dev (no infra false positives)", () => {
  assert.deepEqual(routeSlackCommand("corrige le bug dans le déploiement automatique"), {
    type: "dev",
    prompt: "corrige le bug dans le déploiement automatique"
  });
  assert.deepEqual(routeSlackCommand("ajoute des logs au module de paiement"), {
    type: "dev",
    prompt: "ajoute des logs au module de paiement"
  });
  assert.deepEqual(routeSlackCommand("améliore la page tarifs"), { type: "dev", prompt: "améliore la page tarifs" });
});
