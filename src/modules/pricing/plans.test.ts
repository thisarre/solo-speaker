import assert from "node:assert/strict";
import test from "node:test";
import { getPricingPlans, pricingPlans } from "./plans";

test("pricingPlans exposes production-ready plans in display order", () => {
  assert.deepEqual(
    pricingPlans.map((plan) => plan.id),
    ["starter", "studio", "team"]
  );
  assert.equal(pricingPlans.filter((plan) => plan.highlighted).length, 1);
  assert.equal(pricingPlans.find((plan) => plan.highlighted)?.id, "studio");
  assert.equal(pricingPlans[0].price, "14 jours");
  assert.equal(pricingPlans[0].features.some((feature) => feature.includes("5 prises de parole maximum")), true);
  assert.equal(pricingPlans[1].price, "99 EUR");
  assert.match(pricingPlans[1].secondaryPrice?.badge ?? "", /45 EUR/i);
  assert.equal(pricingPlans[1].checkoutPlan, "studio_yearly");
  assert.equal(pricingPlans[2].price, "240 EUR");
  assert.equal(pricingPlans[2].secondaryPrice?.price, "29 EUR");
  assert.match(pricingPlans[2].secondaryPrice?.badge ?? "", /108 EUR/i);
});

test("pricingPlans route paid Studio and Team CTAs to Stripe Checkout", () => {
  for (const locale of ["en", "fr"] as const) {
    const [trial, studio, team] = getPricingPlans(locale);
    assert.equal(trial.ctaHref.startsWith(`/${locale}/signup`), true);
    assert.equal(studio.ctaHref, "/api/billing/checkout");
    assert.equal(studio.checkoutPlan, "studio_yearly");
    assert.equal(team.ctaHref, "/api/billing/checkout");
    assert.equal(team.checkoutPlan, "team_yearly");
    assert.equal(team.features.length >= 4, true);
  }
});
