import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: "http://127.0.0.1:3005",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3005",
    url: "http://127.0.0.1:3005",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: "Mobile Chrome",
      use: {
        ...devices["Pixel 7"],
      },
    },
  ],
});
