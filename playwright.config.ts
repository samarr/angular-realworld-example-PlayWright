import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/tests", // Updated to point to the new tests directory
  testMatch: /.*\.spec\.ts/, // Match all spec files
  reporter: [
    ["html"],
    ["list"], // Adding list reporter for CLI output
  ],
  fullyParallel: true,
  workers: 10,
  timeout: 30 * 1000,
  retries: 1, // Retry failed tests once
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    screenshot: "only-on-failure", // Capture screenshots only on test failures
    video: "retain-on-failure", // Retain video only on test failures
    trace: "retain-on-failure", // Retain trace only on test failures
    baseURL: "http://localhost:4200", // Base URL for the application
    launchOptions: {
      slowMo: 0,
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        viewport: { width: 1280, height: 720 },
        launchOptions: {
          args: ["--disable-dev-shm-usage", "--no-sandbox"],
        },
      },
    },
    {
      name: "firefox",
      use: {
        browserName: "firefox",
        viewport: { width: 1280, height: 720 },
        contextOptions: {
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:95.0) Gecko/20100101 Firefox/95.0",
        },
      },
    },
    {
      name: "webkit",
      use: {
        browserName: "webkit",
        viewport: { width: 1280, height: 720 },
        // Webkit specific settings for Safari
        actionTimeout: 15000,
        navigationTimeout: 20000,
      },
    },
  ],
});
