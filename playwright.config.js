import { defineConfig } from "@playwright/test";
export default defineConfig({
  webServer: {
    command: "python3 -m http.server 8763 --bind 127.0.0.1",
    url: "http://127.0.0.1:8763",
    reuseExistingServer: true,
    timeout: 10000,
  },
  testDir: "./tests/browser",
  timeout: 20000,
  expect: { timeout: 3000 },
  fullyParallel: false,
  workers: 1,
  reporter: [
    ["list"],
    ["json", { outputFile: "reports/browser-results.json" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:8763",
    viewport: { width: 1280, height: 720 },
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  outputDir: "reports/test-artifacts",
});
