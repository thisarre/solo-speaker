import { expect, test } from "@playwright/test";

// Real-browser smoke checks: catch client-side JS breakage that HTTP probes miss.

test("home page renders with no uncaught JS exception", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/fr", { waitUntil: "networkidle" });
  await expect(page).toHaveTitle(/Solo Speaker/i);
  await expect(page.getByRole("link", { name: /pricing|tarifs/i }).first()).toBeVisible();

  expect(pageErrors, `Uncaught JS errors:\n${pageErrors.join("\n")}`).toHaveLength(0);
});

test("signup password meter and confirmation react in real time", async ({ page }) => {
  // networkidle + real keystrokes so the controlled input is reacted to after hydration.
  await page.goto("/fr/signup", { waitUntil: "networkidle" });

  const password = page.locator("#password");
  await expect(password).toBeVisible();
  await password.pressSequentially("test1234", { delay: 25 });
  await expect(password).toHaveValue("test1234");
  await expect(page.getByText("Faible", { exact: true })).toBeVisible();

  await password.fill("Aurore7Soleil!");
  await expect(page.getByText("Fort", { exact: true })).toBeVisible();

  await page.locator("#confirmPassword").fill("Aurore7Soleil!");
  await expect(page.getByText("Les mots de passe correspondent.")).toBeVisible();
});

test("login page exposes the sign-in form", async ({ page }) => {
  await page.goto("/fr/login", { waitUntil: "domcontentloaded" });
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
});
