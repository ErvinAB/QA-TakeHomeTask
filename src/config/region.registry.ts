import type { RegionConfig } from "./region.types";

const VALID_REGIONS = ["eu", "us"] as const;
type ValidRegion = (typeof VALID_REGIONS)[number];

function portFor(region: ValidRegion): number {
  const raw = process.env[region === "eu" ? "EU_PORT" : "US_PORT"] ?? (region === "eu" ? "8080" : "8081");
  const port = Number(raw);

  if (!Number.isFinite(port) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `Region "${region}" has invalid port "${raw}". Port must be an integer between 1 and 65535.`
    );
  }

  return port;
}

function euConfig(): RegionConfig {
  const port = portFor("eu");
  return {
    name: "eu",
    port,
    webBaseUrl: `http://127.0.0.1:${port}`,
    apiBaseUrl: `http://127.0.0.1:${port}/api/v1`,
    browserLocale: "en-GB",
    browserTimezone: "Europe/London",
    serverLocale: "en_GB",
    currencyCode: "EUR",
    composeProjectName: "qa-firefly-eu",
    dbDatabase: "firefly_eu",
    dbUsername: "firefly_eu",
    defaultTestEmail: "qa-eu@test.example.com",
    testUserPassword: "",
  };
}

function usConfig(): RegionConfig {
  const port = portFor("us");
  return {
    name: "us",
    port,
    webBaseUrl: `http://127.0.0.1:${port}`,
    apiBaseUrl: `http://127.0.0.1:${port}/api/v1`,
    browserLocale: "en-US",
    browserTimezone: "America/New_York",
    serverLocale: "en_US",
    currencyCode: "USD",
    composeProjectName: "qa-firefly-us",
    dbDatabase: "firefly_us",
    dbUsername: "firefly_us",
    defaultTestEmail: "qa-us@test.example.com",
    testUserPassword: "",
  };
}

const REGION_FACTORIES: Record<ValidRegion, () => RegionConfig> = {
  eu: euConfig,
  us: usConfig,
};

export function getRegion(regionName?: string): RegionConfig {
  const raw = (regionName ?? process.env.REGION ?? "").toLowerCase();

  if (!(VALID_REGIONS as readonly string[]).includes(raw)) {
    const supported = VALID_REGIONS.join(", ");
    throw new Error(
      raw
        ? `Invalid region "${raw}". Supported: ${supported}.`
        : `Region not specified. Set REGION=eu or REGION=us.`
    );
  }

  return REGION_FACTORIES[raw as ValidRegion]();
}

export type { ValidRegion };
