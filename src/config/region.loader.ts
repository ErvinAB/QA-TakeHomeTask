import { existsSync, readFileSync } from "fs";
import { join } from "path";
import type { RegionConfig } from "./region.types";
import { getRegion } from "./region.registry";

const RUNTIME_DIR = join(__dirname, "..", "..", ".runtime");

function resolveCredentials(region: RegionConfig): RegionConfig {
  const envEmail = process.env[`${region.name.toUpperCase()}_TEST_EMAIL`];
  const envPassword = process.env[`${region.name.toUpperCase()}_TEST_PASSWORD`];
  if (envEmail && envPassword) {
    return { ...region, defaultTestEmail: envEmail, testUserPassword: envPassword };
  }

  const credsFile = join(RUNTIME_DIR, `${region.name}.creds.json`);
  if (existsSync(credsFile)) {
    try {
      const creds = JSON.parse(readFileSync(credsFile, "utf-8"));
      if (creds.testEmail && creds.testPassword) {
        return { ...region, defaultTestEmail: creds.testEmail, testUserPassword: creds.testPassword };
      }
    } catch {
      // fall through to defaults
    }
  }

  return region;
}

export function loadRegion(regionName?: string): RegionConfig {
  const region = getRegion(regionName);

  if (!region.webBaseUrl || !region.apiBaseUrl) {
    throw new Error(`Region "${region.name}" is missing required URL configuration.`);
  }

  if (!region.browserLocale || !region.browserTimezone) {
    throw new Error(`Region "${region.name}" is missing browser locale or timezone configuration.`);
  }

  if (!region.currencyCode) {
    throw new Error(`Region "${region.name}" is missing currency code configuration.`);
  }

  const loaded = resolveCredentials(region);

  if (!loaded.defaultTestEmail || !loaded.defaultTestEmail.trim()) {
    throw new Error(
      `Region "${region.name}" is missing a test email. Run "REGION=${region.name} npm run env:init" to generate credentials.`
    );
  }

  if (!loaded.testUserPassword || !loaded.testUserPassword.trim()) {
    throw new Error(
      `Region "${region.name}" is missing a test password. Run "REGION=${region.name} npm run env:init" to generate credentials.`
    );
  }

  return loaded;
}

export function resolveToken(region: RegionConfig): string {
  const token = process.env.FIREFLY_TOKEN;
  if (token) return token;

  const tokenFile = join(RUNTIME_DIR, `${region.name}.token.txt`);
  if (existsSync(tokenFile)) {
    const fileToken = readFileSync(tokenFile, "utf-8").trim();
    if (fileToken) return fileToken;
  }

  throw new Error(
    `No personal access token available for region "${region.name}". ` +
      `Set FIREFLY_TOKEN or run bootstrap first.`
  );
}

export type { ValidRegion } from "./region.registry";
