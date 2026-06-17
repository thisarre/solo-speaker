import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canAutoScroll, effectiveScrollSpeed, nextScrollTop } from "./auto-scroll-logic";

describe("auto-scroll logic", () => {
  it("maps multipliers to a predictable base speed", () => {
    assert.equal(effectiveScrollSpeed(0.75), 24);
    assert.equal(effectiveScrollSpeed(1), 32);
    assert.equal(effectiveScrollSpeed(1.25), 40);
    assert.equal(effectiveScrollSpeed(1.5), 48);
    assert.equal(effectiveScrollSpeed(3), 96);
  });

  it("only scrolls when the classic teleprompter can move", () => {
    assert.equal(canAutoScroll({ clientHeight: 800, isPlaying: false, scrollHeight: 2400, scrollTop: 0 }), false);
    assert.equal(canAutoScroll({ clientHeight: 800, isPlaying: true, scrollHeight: 2400, scrollTop: 0, voiceFollowActive: true }), false);
    assert.equal(canAutoScroll({ clientHeight: 800, isPlaying: true, scrollHeight: 700, scrollTop: 0 }), false);
    assert.equal(canAutoScroll({ clientHeight: 800, isPlaying: true, scrollHeight: 2400, scrollTop: 1599.5 }), false);
    assert.equal(canAutoScroll({ clientHeight: 800, isPlaying: true, scrollHeight: 2400, scrollTop: 240 }), true);
  });

  it("advances by pixels per second and clamps at the bottom", () => {
    assert.equal(
      nextScrollTop({
        clientHeight: 800,
        deltaSeconds: 2,
        scrollHeight: 2400,
        scrollTop: 100,
        speedMultiplier: 1
      }),
      164
    );

    assert.equal(
      nextScrollTop({
        clientHeight: 800,
        deltaSeconds: 10,
        scrollHeight: 1000,
        scrollTop: 190,
        speedMultiplier: 4
      }),
      200
    );
  });
});
