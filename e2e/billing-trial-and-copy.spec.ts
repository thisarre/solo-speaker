import { expect, test } from "@playwright/test";

// Billing spine E2E — only run against a deploy that has the new 3-tier pricing.
// Enable with BILLING_E2E=1 (e.g. against a preview/staging BASE_URL) after deploy.
// Trial framing + legacy "14 jours/14 days" copy removal.
test.beforeEach(() => {
  test.skip(!process.env.BILLING_E2E, "billing E2E gated behind BILLING_E2E=1 (post-deploy)");
});

test("pricing page no longer mentions a 14-day trial", async ({ page }) => {
  await page.goto("/fr/pricing", { waitUntil: "networkidle" });
  await expect(page.locator("body")).not.toContainText(/14\s*(jours|days)/i);
});

test("home hero no longer mentions a 14-day trial", async ({ page }) => {
  await page.goto("/fr", { waitUntil: "networkidle" });
  await expect(page.locator("body")).not.toContainText(/14\s*(jours|days)/i);
});

test("FR trial framing shows '5 prises de parole' and 'sans carte bancaire'", async ({ page }) => {
  await page.goto("/fr/pricing", { waitUntil: "networkidle" });
  await expect(page.getByText(/5 prises de parole/i).first()).toBeVisible();
  await expect(page.getByText(/sans carte bancaire/i).first()).toBeVisible();
});

test("EN trial framing shows '5 talks'", async ({ page }) => {
  await page.goto("/en/pricing", { waitUntil: "networkidle" });
  await expect(page.getByText(/5 talks/i).first()).toBeVisible();
  await expect(page.getByText(/no credit card/i).first()).toBeVisible();
});
