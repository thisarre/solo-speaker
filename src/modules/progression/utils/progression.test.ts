import assert from "node:assert/strict";
import test from "node:test";
import { buildGlobalRecommendations } from "./build-global-recommendations";
import { calculateGlobalProgression } from "./calculate-global-progression";
import { calculateStatusDistribution } from "./calculate-status-distribution";
import { calculateTalkReadiness } from "./calculate-talk-readiness";
import { calculateTypeDistribution } from "./calculate-type-distribution";
import type { ProgressionTalkInput } from "@/modules/progression/types";

const baseTalk: ProgressionTalkInput = {
  id: "talk-1",
  title: "Marcher avec courage",
  type: "sermon",
  status: "draft",
  audience: "Jeunes adultes",
  durationMinutes: 3,
  sections: [
    { id: "brief", heading: "Brief", body: "Encourager l'audience à avancer avec foi.", position: 0 },
    { id: "intro", heading: "Introduction", body: "La peur parle fort, mais la foi ouvre une route.", position: 1 },
    { id: "body", heading: "Développement", body: Array.from({ length: 310 }, (_, index) => `mot${index}`).join(" "), position: 2 }
  ]
};

test("calculateTalkReadiness scores a complete talk higher than an empty one", () => {
  const empty = calculateTalkReadiness({ ...baseTalk, title: "", audience: "", sections: [], durationMinutes: 10 });
  const complete = calculateTalkReadiness({ ...baseTalk, status: "ready" });

  assert.equal(empty.score < 40, true);
  assert.equal(complete.score >= 80, true);
  assert.equal(complete.isReady, true);
});

test("calculateStatusDistribution counts each status", () => {
  const rows = calculateStatusDistribution([
    { status: "draft" },
    { status: "ready" },
    { status: "ready" },
    { status: "archived" }
  ]);

  assert.equal(rows.find((row) => row.status === "ready")?.count, 2);
  assert.equal(rows.find((row) => row.status === "draft")?.percent, 25);
});

test("calculateTypeDistribution counts each talk type", () => {
  const rows = calculateTypeDistribution([{ type: "sermon" }, { type: "pitch" }, { type: "sermon" }]);

  assert.equal(rows.find((row) => row.type === "sermon")?.count, 2);
  assert.equal(rows.find((row) => row.type === "pitch")?.percent, 33);
});

test("buildGlobalRecommendations returns deterministic global actions", () => {
  const missingAudience = calculateTalkReadiness({ ...baseTalk, audience: "" });
  const ready = calculateTalkReadiness({ ...baseTalk, status: "ready" });
  const recommendations = buildGlobalRecommendations([missingAudience, ready]);

  assert.equal(recommendations[0].id, "missing-audience");
  assert.equal(recommendations.some((item) => item.id === "practice-ready"), true);
  assert.equal(recommendations.length <= 5, true);
});

test("calculateGlobalProgression averages active talks and excludes archives", () => {
  const report = calculateGlobalProgression([
    { ...baseTalk, status: "ready" },
    { ...baseTalk, id: "draft-talk", title: "", audience: "", sections: [] },
    { ...baseTalk, id: "archived-talk", status: "archived", title: "", audience: "", sections: [] }
  ]);

  assert.equal(report.activeTalks, 2);
  assert.equal(report.archivedTalks, 1);
  assert.equal(report.toFinish.length > 0, true);
  assert.equal(report.readyToPresent.length > 0, true);
  assert.equal(report.score > 0, true);
});
