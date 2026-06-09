import { defineConfig, devices } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 2,
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["list"],
    ["json", { outputFile: "test-results/results.json" }],
  ],
  timeout: 60000,
  expect: { timeout: 15000 },
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15000,
  },
  projects: [
    {
      name: "auth-setup",
      testMatch: /auth\.setup\.ts/,
    },

    {
      name: "chromium-desktop",
      testIgnore: /mobile\/.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
      dependencies: ["auth-setup"],
    },

    {
      name: "chromium-mobile",
      use: {
        ...devices["iPhone 15"],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        defaultBrowserType: "chromium",
      },
      testMatch: /mobile\/.*\.spec\.ts/,
    },

    {
      name: "android-mobile",
      use: {
        ...devices["Pixel 7"],
        viewport: { width: 412, height: 915 },
        isMobile: true,
        hasTouch: true,
        defaultBrowserType: "chromium",
      },
      testMatch: /mobile\/.*\.spec\.ts/,
    },
  ],

  webServer: {
    command: "npx tsx tests/e2e/fixtures/seed.ts && npm run dev",
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
