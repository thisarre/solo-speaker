import { defineConfig, devices } from "@playwright/test";

// Browser-level monitoring run against the LIVE site (or BASE_URL). Kept out of
// the app tsconfig/eslint (see tsconfig "exclude" + eslint ignores) and executed
// only by the scheduled GitHub Actions workflow, never on the VPS.
export default defineConfig({
  testDir: ".",
  timeout: 45_000,
  retries: 1,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "results.json" }]],
  use: {
    baseURL: process.env.BASE_URL || "https://solospeaker.com",
    headless: true,
    actionTimeout: 15_000,
    navigationTimeout: 30_000
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
});
