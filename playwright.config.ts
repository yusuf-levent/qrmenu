import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "pnpm --filter api dev",
      url: "http://localhost:4000/public/menu/test-kafe",
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: "pnpm --filter web dev",
      url: "http://localhost:3001/m/test-kafe",
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
