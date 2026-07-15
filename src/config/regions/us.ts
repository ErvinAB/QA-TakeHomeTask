import type { RegionConfig } from "../region.types";

const usRegion: RegionConfig = {
  name: "us",
  webBaseUrl: process.env.US_WEB_BASE_URL ?? "https://parabank.parasoft.com/parabank",
  apiBaseUrl:
    process.env.US_API_BASE_URL ??
    "https://parabank.parasoft.com/parabank/services/bank",
  browserLocale: "en-US",
  browserTimezone: "America/New_York",
  credentials: {
    username: process.env.US_USERNAME ?? "john",
    password: process.env.US_PASSWORD ?? "demo",
  },
  metadata: {
    region: "us-east",
    dataResidency: "us",
  },
};

export default usRegion;
