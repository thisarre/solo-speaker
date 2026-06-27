import assert from "node:assert/strict";
import test from "node:test";
import { getLogoAssets } from "./logo-assets";

test("getLogoAssets exposes theme-aware logo and favicon paths", () => {
  assert.deepEqual(getLogoAssets(), {
    darkLogo: "/brand/solo-speaker-logo-white-transparent-cropped.png",
    favicon: "/brand/solo-speaker-favicon-source.png",
    lightLogo: "/brand/solo-speaker-logo-transparent-cropped.png"
  });
});
