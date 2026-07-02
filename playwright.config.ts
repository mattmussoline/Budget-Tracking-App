import { defineConfig, devices } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";

function readLocalAppPassword() {
  if (!existsSync(".env.local")) {
    return null;
  }

  const line = readFileSync(".env.local", "utf8")
    .split("\n")
    .find((entry) => entry.startsWith("APP_PASSWORD="));

  return line?.slice("APP_PASSWORD=".length).replace(/^['"]|['"]$/g, "") || null;
}

const appPassword = process.env.APP_PASSWORD ?? readLocalAppPassword() ?? "playwright-password";
process.env.APP_PASSWORD = appPassword;

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry"
  },
  webServer: {
    command: "npm run dev",
    env: {
      APP_PASSWORD: appPassword
    },
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
    timeout: 120_000
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } }
  ]
});
