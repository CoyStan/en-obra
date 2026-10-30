import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Runs against the static web export. Build it first with `npm run build:web`.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://127.0.0.1:4319",
    locale: "es-MX",
    timezoneId: "America/Mexico_City",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "phone",
      use: {
        ...devices["Pixel 7"],
        // Use the system Chrome locally when Playwright's own browser isn't installed.
        ...(!process.env.CI && existsSync("/usr/bin/google-chrome") ? { channel: "chrome" } : {}),
      },
    },
  ],
  webServer: {
    command: "node scripts/serve-web.mjs dist 4319",
    url: "http://127.0.0.1:4319",
    reuseExistingServer: false,
  },
});
