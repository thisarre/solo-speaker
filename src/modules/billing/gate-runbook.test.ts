import assert from "node:assert/strict";
import test from "node:test";
import { can, type Capability } from "./capabilities";

// "Runbook des 5 comptes" — gate resolution validated in isolation (per plan),
// which is what flipping profiles.billing_plan would exercise, minus the prod risk.
// getActivePlan() returns profiles.billing_plan directly (team members resolve to
// 'team' via teams.owner_id; owner cancellation flips members back to 'trial' — PR #10),
// so validating can(plan, cap) covers the entitlement side end-to-end.

const PRO_CAPS: Capability[] = ["export.branded", "analytics.rehearsal", "talk.versions", "talk.multilingual", "share.public"];
const TEAM_CAPS: Capability[] = ["team.seats", "team.sharedLibrary"];
const ALL_CAPS = [...PRO_CAPS, ...TEAM_CAPS];

test("runbook trial: aucune capability premium", () => {
  for (const cap of ALL_CAPS) assert.equal(can("trial", cap), false, cap);
});

test("runbook studio: 5 Pro caps false, 2 team caps false", () => {
  for (const cap of ALL_CAPS) assert.equal(can("studio", cap), false, cap);
});

test("runbook pro: 5 Pro caps true, 2 team caps false", () => {
  for (const cap of PRO_CAPS) assert.equal(can("pro", cap), true, cap);
  for (const cap of TEAM_CAPS) assert.equal(can("pro", cap), false, cap);
});

test("runbook team: 5 Pro caps true + 2 team caps true", () => {
  for (const cap of ALL_CAPS) assert.equal(can("team", cap), true, cap);
});
