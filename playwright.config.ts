import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e", // Folder where your E2E tests live
  reporter: "html", // Generate HTML report for test results
  fullyParallel: true, // Run tests in parallel
  workers: 10, // Number of parallel workers
  timeout: 30 * 1000, // Test timeout in milliseconds
  use: {
    headless: true, // Run in headless mode (can be set to false for debugging)
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    launchOptions: {
      slowMo: 0, // Slow down execution for debugging
    },
  },
  projects: [
    {
      name: "chromium",
    },
    {
      name: "firefox",
    },
    {
      name: "webkit",
    },
  ],
});
