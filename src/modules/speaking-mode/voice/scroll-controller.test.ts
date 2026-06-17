import assert from "node:assert/strict";
import test from "node:test";
import { anchoredScrollTop, estimateSpokenProgress } from "./scroll-controller";

test("anchoredScrollTop places the anchor at the reading line", () => {
  // Anchor sits 600px below the container top; with a 1000px viewport and a 0.42 reading line,
  // the target scrollTop is scrollTop(200) + 600 - 420 = 380.
  assert.equal(
    anchoredScrollTop({ anchorOffset: 600, clientHeight: 1000, maxScroll: 5000, readingAnchorRatio: 0.42, scrollTop: 200 }),
    380
  );
});

test("anchoredScrollTop never returns a negative scroll position", () => {
  assert.equal(
    anchoredScrollTop({ anchorOffset: 50, clientHeight: 1000, maxScroll: 5000, readingAnchorRatio: 0.42, scrollTop: 0 }),
    0
  );
});

test("anchoredScrollTop clamps to the maximum scrollable distance", () => {
  assert.equal(
    anchoredScrollTop({ anchorOffset: 900, clientHeight: 400, maxScroll: 300, readingAnchorRatio: 0.4, scrollTop: 200 }),
    300
  );
});

test("estimateSpokenProgress locates spoken words near the end of a paragraph", () => {
  const progress = estimateSpokenProgress({
    fullText: "Nous commençons par poser le contexte puis nous avançons vers la décision finale et l'appel à agir.",
    spokenText: "décision finale et l'appel"
  });

  assert.ok(progress !== null && progress > 0.7, `expected late progress, got ${progress}`);
});

test("estimateSpokenProgress returns null for unrelated improvisation", () => {
  assert.equal(
    estimateSpokenProgress({
      fullText: "Nous commençons par poser le contexte puis nous avançons vers la décision finale.",
      spokenText: "je vais prendre un exemple différent"
    }),
    null
  );
});
