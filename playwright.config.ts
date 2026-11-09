import { defineConfig, devices } from "@playwright/test";

const viewports = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
];

export default defineConfig({
  testDir: "./tests",
  // Budgets need a production server: playwright.prod.config.ts runs them.
  testIgnore: /\.perf\.spec\.ts$/,
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
  projects: viewports.map((viewport) => ({
    name: `${viewport.width}x${viewport.height}`,
    use: { ...devices["Desktop Chrome"], viewport },
  })),
});
