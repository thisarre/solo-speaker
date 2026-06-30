import assert from "node:assert/strict";
import test from "node:test";
import { getPricingPlans, pricingPlans } from "./plans";

function euros(price: string): number {
  return Number(price.replace(/[^\d]/g, ""));
}

test("pricingPlans exposes three paid tiers in display order", () => {
  assert.deepEqual(
    pricingPlans.map((plan) => plan.id),
    ["studio", "pro", "team"]
  );
  assert.equal(pricingPlans.filter((plan) => plan.highlighted).length, 1);
  assert.equal(pricingPlans.find((plan) => plan.highlighted)?.id, "studio");

  const [studio, pro, team] = pricingPlans;
  assert.equal(studio.price, "99 EUR");
  assert.match(studio.secondaryPrice.badge, /45/);

  assert.equal(pro.price, "159 EUR");
  assert.match(pro.secondaryPrice.badge, /69/);
  assert.equal(pro.checkoutPlan, "pro_yearly");

  assert.equal(team.perSeat, true);
  assert.equal(team.minSeats, 3);
  assert.equal(team.price, "49 EUR");
  assert.equal(studio.perSeat, false);
  assert.equal(pro.perSeat, false);
});

test("each tier holds a ~30% annual gap vs 12x monthly", () => {
  for (const plan of pricingPlans) {
    const monthlyAmount = euros(plan.secondaryPrice.price);
    const yearlyAmount = euros(plan.price);
    assert.ok(monthlyAmount > 0 && yearlyAmount > 0, `${plan.id} prices parse`);
    assert.ok(
      yearlyAmount <= monthlyAmount * 12 * 0.72,
      `${plan.id}: ${yearlyAmount} <= ${monthlyAmount * 12 * 0.72}`
    );
  }
});

test("pricingPlans route paid CTAs to Stripe Checkout in both locales", () => {
  for (const locale of ["en", "fr"] as const) {
    const [studio, pro, team] = getPricingPlans(locale);
    assert.equal(studio.ctaHref, "/api/billing/checkout");
    assert.equal(studio.checkoutPlan, "studio_yearly");
    assert.equal(pro.checkoutPlan, "pro_yearly");
    assert.equal(team.checkoutPlan, "team_yearly");
    assert.equal(team.features.length >= 4, true);
  }
});
