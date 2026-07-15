import type { RegionConfig } from "./region.types";
import euRegion from "./regions/eu";
import usRegion from "./regions/us";

const SUPPORTED_REGIONS: Record<string, RegionConfig> = {
  eu: euRegion,
  us: usRegion,
};

export function loadRegion(regionName?: string): RegionConfig {
  const name = (regionName ?? process.env.REGION ?? "eu").toLowerCase();

  const region = SUPPORTED_REGIONS[name];
  if (!region) {
    const supported = Object.keys(SUPPORTED_REGIONS).join(", ");
    throw new Error(
      `Unsupported region "${name}". Supported regions: ${supported}. ` +
        `Set the REGION environment variable to a valid value.`
    );
  }

  if (!region.webBaseUrl || !region.apiBaseUrl) {
    throw new Error(
      `Region "${name}" is missing required URL configuration. ` +
        `Check ${name.toUpperCase()}_WEB_BASE_URL and ${name.toUpperCase()}_API_BASE_URL.`
    );
  }

  if (!region.credentials.username || !region.credentials.password) {
    throw new Error(
      `Region "${name}" is missing required credentials. ` +
        `Check ${name.toUpperCase()}_USERNAME and ${name.toUpperCase()}_PASSWORD.`
    );
  }

  if (!region.browserLocale || !region.browserTimezone) {
    throw new Error(
      `Region "${name}" is missing browser locale or timezone configuration. ` +
        `Check browserLocale and browserTimezone in the region definition.`
    );
  }

  return region;
}
