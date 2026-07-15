import type { RegionConfig } from "../region.types";

const euRegion: RegionConfig = {
  name: "eu",
  webBaseUrl: process.env.EU_WEB_BASE_URL ?? "https://parabank.parasoft.com/parabank",
  apiBaseUrl:
    process.env.EU_API_BASE_URL ??
    "https://parabank.parasoft.com/parabank/services/bank",
  browserLocale: "en-GB",
  browserTimezone: "Europe/London",
  credentials: {
    username: process.env.EU_USERNAME ?? "john",
    password: process.env.EU_PASSWORD ?? "demo",
  },
  metadata: {
    region: "europe-west",
    dataResidency: "eu",
  },
};

export default euRegion;
