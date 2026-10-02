import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve("src") } },
  // tests/ belongs to Playwright.
  test: { include: ["src/**/*.test.ts"] },
});
