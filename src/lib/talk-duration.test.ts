import assert from "node:assert/strict";
import test from "node:test";
import { parseTalkDurationMinutes, DEFAULT_TALK_DURATION_MINUTES } from "./talk-duration";

/** Audit 2026-07-18, reco UX-4 : durée cible fixable dès la création. */

test("parseTalkDurationMinutes : valeurs valides, bornes et replis (UX-4)", () => {
  assert.equal(parseTalkDurationMinutes("25"), 25);
  assert.equal(parseTalkDurationMinutes(" 40 "), 40);
  assert.equal(parseTalkDurationMinutes("12.6"), 13);
  // Bornes : jamais < 1, plafonné à 600.
  assert.equal(parseTalkDurationMinutes("0"), DEFAULT_TALK_DURATION_MINUTES);
  assert.equal(parseTalkDurationMinutes("-5"), DEFAULT_TALK_DURATION_MINUTES);
  assert.equal(parseTalkDurationMinutes("9999"), 600);
  // Invalide / vide → défaut produit.
  assert.equal(parseTalkDurationMinutes(""), DEFAULT_TALK_DURATION_MINUTES);
  assert.equal(parseTalkDurationMinutes("abc"), DEFAULT_TALK_DURATION_MINUTES);
  assert.equal(parseTalkDurationMinutes(null), DEFAULT_TALK_DURATION_MINUTES);
});
