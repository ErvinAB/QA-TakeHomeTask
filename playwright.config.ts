import { loadRegion } from "./src/config/region.loader";

const region = loadRegion();
const isCI = !!process.env.CI;

export default {
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 1 : undefined,
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
  ],
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "api",
      testDir: "./tests/api",
    },
    {
      name: "web",
      testDir: "./tests/web",
      use: {
        baseURL: region.webBaseUrl,
        locale: region.browserLocale,
        timezoneId: region.browserTimezone,
        headless: true,
      },
    },
  ],
  outputDir: "test-results",
};
