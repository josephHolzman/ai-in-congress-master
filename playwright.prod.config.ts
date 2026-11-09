import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.config";

// The suite against a production server (`npm run build` first), including
// tests/tracker.perf.spec.ts, whose budgets mean nothing under `next dev`.
//   npx playwright test --config playwright.prod.config.ts
// The perf project waits for the others, so no parallel test steals its CPU
// (TBT doubled when it shared). Next's own binary rather than npx, so
// stopping the server stops it.
const projects = base.projects!;
export default defineConfig({
  ...base,
  use: { ...base.use, baseURL: "http://localhost:3300" },
  projects: [
    ...projects,
    {
      name: "perf",
      testIgnore: [],
      testMatch: /\.perf\.spec\.ts$/,
      dependencies: projects.map((p) => p.name!),
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: "node node_modules/next/dist/bin/next start -p 3300",
    url: "http://localhost:3300",
    reuseExistingServer: true,
  },
});
