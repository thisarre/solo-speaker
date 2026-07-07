import { expect, test } from "@playwright/test";
import { MIN_TEAM_SEATS } from "../src/modules/billing/stripe-prices";

// Billing spine E2E — only run against a deploy that has the new 3-tier pricing.
// Enable with BILLING_E2E=1 (e.g. against a preview/staging BASE_URL) after deploy.
// Auth-free CTA wiring + checkout redirect checks. NO real payment is performed.
test.beforeEach(() => {
  test.skip(!process.env.BILLING_E2E, "billing E2E gated behind BILLING_E2E=1 (post-deploy)");
});

test("each paid tier CTA points at /api/billing/checkout with the right plan (seats only for Team)", async ({ page }) => {
  await page.goto("/fr/pricing", { waitUntil: "networkidle" });

  // Studio / Pro: single-seat, no seats= param.
  const studioCta = page.locator('a[href*="/api/billing/checkout"][href*="plan=studio_"]').first();
  const proCta = page.locator('a[href*="/api/billing/checkout"][href*="plan=pro_"]').first();
  await expect(studioCta).toBeVisible();
  await expect(proCta).toBeVisible();
  expect(await studioCta.getAttribute("href")).not.toContain("seats=");
  expect(await proCta.getAttribute("href")).not.toContain("seats=");

  // Team: carries the seat count (defaults to MIN_TEAM_SEATS).
  const teamCta = page.locator('a[href*="/api/billing/checkout"][href*="plan=team_"]').first();
  await expect(teamCta).toBeVisible();
  const teamHref = await teamCta.getAttribute("href");
  expect(teamHref).toContain("plan=team_");
  expect(teamHref).toContain(`seats=${MIN_TEAM_SEATS}`);
});

test("logged-out checkout for a valid plan redirects to /signup carrying that plan", async ({ page }) => {
  // The checkout route is a server redirect: a logged-out user is bounced to signup.
  await page.goto("/api/billing/checkout?plan=studio_yearly&locale=fr", { waitUntil: "domcontentloaded" });
  await page.waitForURL(/\/signup/);
  expect(page.url()).toContain("/signup");
  expect(page.url()).toContain("plan=studio_yearly");
});

test("explicit seats below the minimum is rejected with error=invalid-seats", async ({ page }) => {
  await page.goto("/api/billing/checkout?plan=team_yearly&seats=2&locale=fr", { waitUntil: "domcontentloaded" });
  await page.waitForURL(/error=invalid-seats/);
  expect(page.url()).toContain("/pricing");
  expect(page.url()).toContain("error=invalid-seats");
});

test("Team checkout with NO seats param is old-link-compatible (defaults to the minimum, no invalid-seats)", async ({ page }) => {
  // Old live Team links have no seats param → must default to 3, never error.
  // Logged out, that means landing on /signup with the team plan, NOT an invalid-seats error.
  await page.goto("/api/billing/checkout?plan=team_yearly&locale=fr", { waitUntil: "domcontentloaded" });
  await page.waitForURL(/\/signup/);
  expect(page.url()).toContain("/signup");
  expect(page.url()).toContain("plan=team_yearly");
  expect(page.url()).not.toContain("error=invalid-seats");
});
