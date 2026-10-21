import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Load E2E_EMAIL_BASE locally. In CI, env vars come from GitHub secrets instead.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI, // fail CI if someone forgot a `test.only`
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : 2,
  reporter: isCI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: "http://localhost:3000",
    navigationTimeout: 30_000,
    trace: "retain-on-failure", // a step-by-step replay of failed tests
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: {
    // CI tests the real production build. Locally, reuse your running dev server.
    command: isCI ? "npm run build && npm run start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
});
