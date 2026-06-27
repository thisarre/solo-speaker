import assert from "node:assert/strict";
import test from "node:test";
import { filterSearchActions, getSearchActions } from "./search-actions";

test("getSearchActions includes studio destinations with talk count context", () => {
  const actions = getSearchActions(3, "fr");

  assert.equal(actions.find((action) => action.href === "/fr/talks")?.meta, "3 prises de parole");
  assert.equal(actions.some((action) => action.href === "/fr/settings"), true);
});

test("getSearchActions translates create talk action in French", () => {
  const actions = getSearchActions(0, "fr");
  const createAction = actions.find((action) => action.href === "/fr/talks/new?guided=1");

  assert.equal(createAction?.label, "Créer une prise de parole");
  assert.equal(createAction?.meta, "Nouvelle prise de parole");
});

test("filterSearchActions matches labels and keywords", () => {
  const actions = getSearchActions(0, "fr");

  assert.equal(filterSearchActions(actions, "nouveau")[0]?.href, "/fr/talks/new?guided=1");
  assert.equal(filterSearchActions(actions, "prompteur")[0]?.href, "/fr/settings");
  assert.equal(filterSearchActions(actions, "zzz").length, 0);
});
