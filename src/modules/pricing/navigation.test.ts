import assert from "node:assert/strict";
import test from "node:test";
import { getPricingReturnHref } from "./navigation";

test("getPricingReturnHref sends authenticated users back to the studio", () => {
  assert.equal(getPricingReturnHref(true), "/dashboard");
});

test("getPricingReturnHref sends visitors back to the landing page", () => {
  assert.equal(getPricingReturnHref(false), "/");
});
