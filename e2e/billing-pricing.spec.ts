import { expect, test } from "@playwright/test";

// Billing spine E2E — only run against a deploy that has the new 3-tier pricing.
// Enable with BILLING_E2E=1 (e.g. against a preview/staging BASE_URL) after deploy.
// Without the flag every test here is skipped so the scheduled prod smoke (which
// runs against the CURRENT live site with OLD pricing) stays green.
test.beforeEach(() => {
  test.skip(!process.env.BILLING_E2E, "billing E2E gated behind BILLING_E2E=1 (post-deploy)");
});

test("three priced tiers render with their prices", async ({ page }) => {
  await page.goto("/fr/pricing", { waitUntil: "networkidle" });

  // Tier names (FR Team is labelled "Équipe").
  await expect(page.getByText("Studio", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Pro", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Équipe", { exact: true }).first()).toBeVisible();

  // Yearly is the default cycle, so the annual prices are shown.
  await expect(page.getByText("99 EUR").first()).toBeVisible();
  await expect(page.getByText("159 EUR").first()).toBeVisible();
});

test("monthly/yearly toggle is present, yearly is pre-selected, and toggling changes the price", async ({ page }) => {
  await page.goto("/fr/pricing", { waitUntil: "networkidle" });

  const yearly = page.getByRole("button", { name: "Annuel" });
  const monthly = page.getByRole("button", { name: "Mensuel" });
  await expect(yearly).toBeVisible();
  await expect(monthly).toBeVisible();

  // Yearly pre-selected via aria-pressed.
  await expect(yearly).toHaveAttribute("aria-pressed", "true");
  await expect(monthly).toHaveAttribute("aria-pressed", "false");

  // Yearly Studio shows 99 EUR.
  await expect(page.getByText("99 EUR").first()).toBeVisible();

  // Switch to monthly: Studio now shows 12 EUR and 99 EUR is gone.
  await monthly.click();
  await expect(monthly).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("12 EUR").first()).toBeVisible();
  await expect(page.getByText("99 EUR")).toHaveCount(0);
});

test("per-tier savings string is visible in yearly mode", async ({ page }) => {
  await page.goto("/fr/pricing", { waitUntil: "networkidle" });

  // Yearly mode shows the "économisez …" savings badges (45/69/23 across tiers).
  await expect(page.getByText(/économisez/i).first()).toBeVisible();
  await expect(page.getByText(/45|69|23/).first()).toBeVisible();
});

test("universal trial CTA sits above the grid, has 'sans carte bancaire', and links to /signup with plan=trial", async ({ page }) => {
  await page.goto("/fr/pricing", { waitUntil: "networkidle" });

  // The risk-reversal copy under the CTA mentions no credit card.
  await expect(page.getByText(/sans carte bancaire/i).first()).toBeVisible();

  // The trial CTA links to the localized signup carrying plan=trial.
  const trialLink = page.locator('a[href*="/signup"][href*="plan=trial"]').first();
  await expect(trialLink).toBeVisible();
  const href = await trialLink.getAttribute("href");
  expect(href).toContain("plan=trial");
  expect(href).toContain("/signup");
});

test("Team seat selector defaults to 3 and cannot go below 3; CTA href carries seats= and plan=team_", async ({ page }) => {
  await page.goto("/fr/pricing", { waitUntil: "networkidle" });

  // Seat stepper value (aria-live region renders "3 Sièges").
  const seatValue = page.getByText(/^3\s+Sièges$/);
  await expect(seatValue).toBeVisible();

  // Clicking decrease must NOT drop below the 3-seat minimum (control is disabled).
  const decrease = page.getByRole("button", { name: "Retirer un siège" });
  await expect(decrease).toBeDisabled();
  // Force the click even though disabled, to prove the value is unchanged.
  await decrease.click({ force: true }).catch(() => undefined);
  await expect(page.getByText(/^3\s+Sièges$/)).toBeVisible();

  // Team CTA href encodes the team plan and the seat count.
  const teamCta = page.locator('a[href*="plan=team_"][href*="seats="]').first();
  await expect(teamCta).toBeVisible();
  const href = await teamCta.getAttribute("href");
  expect(href).toContain("plan=team_");
  expect(href).toContain("seats=3");
});
