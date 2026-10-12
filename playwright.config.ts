import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:14317",
    headless: true,
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_BUNDLED_CHROMIUM === "1"
          ? undefined
          : process.env.CHROME_PATH ||
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    },
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node tests/start-server.mjs",
    url: "http://127.0.0.1:14317/api/workspace",
    reuseExistingServer: false,
    timeout: 30000,
  },
  reporter: "list",
});
