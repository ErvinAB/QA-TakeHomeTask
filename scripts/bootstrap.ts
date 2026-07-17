import { chromium, type Page } from "playwright";
import { existsSync, readFileSync, writeFileSync, chmodSync } from "fs";
import { join } from "path";
import { z } from "zod";
import { getRegion } from "../src/config/region.registry";
import type { RegionConfig } from "../src/config/region.types";

const RUNTIME_DIR = join(__dirname, "..", ".runtime");

// ── Credentials ──────────────────────────────────────────────────────

interface Creds { testEmail: string; testPassword: string }

function loadCreds(region: RegionConfig): Creds {
  const path = join(RUNTIME_DIR, `${region.name}.creds.json`);
  if (!existsSync(path)) throw new Error(`Runtime credentials not found for "${region.name}". Run env:init first.`);
  return JSON.parse(readFileSync(path, "utf-8")) as Creds;
}

// ── Token validation ─────────────────────────────────────────────────

async function apiFetch(baseUrl: string, token: string, path: string): Promise<{ status: number; body: unknown }> {
  const resp = await fetch(`${baseUrl}/api/v1${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.api+json",
      "Content-Type": "application/json",
    },
  });
  const body = await resp.json().catch(() => null);
  return { status: resp.status, body };
}

async function validateToken(baseUrl: string, token: string): Promise<boolean> {
  try {
    const { status } = await apiFetch(baseUrl, token, "/about/user");
    return status === 200;
  } catch {
    return false;
  }
}

// ── Currency ─────────────────────────────────────────────────────────

async function configureAndVerifyCurrency(baseUrl: string, token: string, region: RegionConfig): Promise<void> {
  const expected = region.currencyCode;
  console.log(`  Configuring native currency to ${expected}...`);

  const { status, body } = await apiFetch(baseUrl, token, "/user-groups");
  if (status !== 200) throw new Error(`Failed to fetch user groups: HTTP ${status}`);

  const groups = (body as { data: Array<{ id: string; attributes: Record<string, unknown> }> }).data;
  if (!groups.length) throw new Error("No user groups found");

  const g = groups[0];
  if (g.attributes.primary_currency_code !== expected) {
    const { status: curStatus, body: curBody } = await apiFetch(baseUrl, token, "/currencies?page=1");
    if (curStatus !== 200) throw new Error(`Failed to list currencies: HTTP ${curStatus}`);
    const currencies = (curBody as { data: Array<{ id: string; attributes: { code: string } }> }).data;
    const match = currencies.find((c) => c.attributes.code === expected);
    if (!match) throw new Error(`Currency "${expected}" not found in Firefly III`);

    const { status: putStatus } = await fetch(`${baseUrl}/api/v1/user-groups/${g.id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: g.attributes.title,
        primary_currency_id: match.id,
        in_use: g.attributes.in_use,
        can_see_members: g.attributes.can_see_members,
      }),
    });
    if (putStatus !== 200) throw new Error(`Failed to set primary currency to ${expected}: HTTP ${putStatus}`);
    console.log(`  ✓ Native currency set to ${expected}`);
  } else {
    console.log(`  ✓ Native currency already set to ${expected}`);
  }

  const { status: vStatus, body: vBody } = await apiFetch(baseUrl, token, "/user-groups");
  if (vStatus !== 200) throw new Error(`Currency verification failed: HTTP ${vStatus}`);
  const verified = (vBody as { data: Array<{ attributes: { primary_currency_code: string } }> }).data;
  if (!verified.length) throw new Error("Currency verification failed: no user groups");
  if (verified[0].attributes.primary_currency_code !== expected) {
    throw new Error(`Currency mismatch: expected "${expected}"`);
  }
  console.log(`  ✓ Native currency verified: ${expected}`);
}

// ── Onboarding (observed v6.6.6 state) ──────────────────────────────

async function dismissOnboarding(page: Page): Promise<void> {
  // On fresh registration, Firefly III v6.6.6 redirects to /new-user
  // which shows Skip/Previous/Next anchor links. Click Skip to proceed.
  for (let i = 0; i < 5; i++) {
    if (!page.url().includes("/new-user")) break;
    const skip = page.locator("a").filter({ hasText: /^Skip$/ });
    if (await skip.first().isVisible().catch(() => false)) {
      await skip.first().click();
      await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
      continue;
    }
    break;
  }
}

// ── Token creation (observed v6.6.6 flow) ────────────────────────────

// v6.6.6 returns { accessToken: "eyJ..." } for personal access tokens
const PATTokenSchema = z.object({
  accessToken: z.string().min(1),
}).passthrough();

async function createPersonalAccessToken(page: Page, region: RegionConfig): Promise<string> {
  await page.goto(`${region.webBaseUrl}/profile/oauth`, { waitUntil: "networkidle", timeout: 30_000 });

  // Prepare response listener before triggering the submission
  const tokenPromise: Promise<string> = page.waitForResponse(
    (resp) =>
      resp.request().method() === "POST" &&
      resp.url().includes("/oauth/personal-access-tokens") &&
      resp.status() === 200,
    { timeout: 15_000 }
  ).then(async (resp) => {
    const body = await resp.json();
    const parsed = PATTokenSchema.safeParse(body);
    if (!parsed.success) {
      throw new Error("Token response failed schema validation");
    }
    return parsed.data.accessToken;
  });

  // Click the known "Create new token" link (observed v6.6.6 selector)
  await page.locator('a:has-text("Create new token")').first().click();

  // Wait for the modal and fill the token name (observed: input[name="name"])
  await page.locator(".modal.in input[name=\"name\"]").waitFor({ state: "visible", timeout: 10_000 });
  await page.locator(".modal.in input[name=\"name\"]").fill(`qa-automation-${region.name}`);

  // Submit via the known "Create" primary button in the modal
  await page.locator(".modal.in .btn-primary").click();

  return tokenPromise;
}

// ── Main ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const region = getRegion();
  const creds = loadCreds(region);
  const tokenPath = join(RUNTIME_DIR, `${region.name}.token.txt`);

  console.log(`\n=== Bootstrapping Firefly III (${region.name.toUpperCase()}) ===\n`);

  // Try reusing existing token
  let token = "";
  if (existsSync(tokenPath)) {
    const existing = readFileSync(tokenPath, "utf-8").trim();
    if (existing && (await validateToken(region.webBaseUrl, existing))) {
      token = existing;
      console.log("  ✓ Existing token validated. Reusing.\n");
    } else {
      console.log("  ⊘ Existing token invalid. Re-provisioning...\n");
    }
  }

  if (!token) {
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.goto(`${region.webBaseUrl}/register`, { waitUntil: "networkidle", timeout: 30_000 });

      if (page.url().includes("/register")) {
        // Fresh instance: registration form present
        const hasConfirm = await page.locator('input[name="password_confirmation"]').isVisible().catch(() => false);
        if (hasConfirm) {
          console.log("  Fresh instance detected. Registering first user...");
          await page.locator('input[name="email"]').fill(creds.testEmail);
          await page.locator('input[name="password"]').fill(creds.testPassword);
          await page.locator('input[name="password_confirmation"]').fill(creds.testPassword);
          await page.getByRole("button", { name: /register/i }).click();
          await page.waitForURL(
            (url) => url.pathname.includes("/dashboard") || url.pathname.includes("/new-user"),
            { timeout: 30_000 }
          );
          console.log(`  ✓ First user registered (landed on ${new URL(page.url()).pathname})`);
        }
      } else {
        // Existing instance: redirected to login
        console.log("  Existing instance detected. Logging in...");
        await page.locator('input[name="email"]').fill(creds.testEmail);
        await page.locator('input[name="password"]').fill(creds.testPassword);
        await page.getByRole("button", { name: /sign.?in/i }).click();
        await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15_000 });
      }

      await dismissOnboarding(page);
      token = await createPersonalAccessToken(page, region);
    } finally {
      await browser.close();
    }
  }

  if (!token) {
    console.error("\n  ✗ Could not create Personal Access Token.");
    console.error(`  Please manually create one at ${region.webBaseUrl}/profile/oauth`);
    process.exit(1);
  }

  console.log("  Validating token...");
  if (!(await validateToken(region.webBaseUrl, token))) {
    console.error("\n  ✗ Token captured but API validation failed. Not saving.");
    process.exit(1);
  }
  console.log("  ✓ Token validated successfully");

  writeFileSync(tokenPath, token, { mode: 0o600 });
  try { chmodSync(tokenPath, 0o600); } catch { /* Windows */ }
  console.log(`  ✓ Token saved to ${tokenPath}`);

  if (process.env.CI) {
    console.log(`::add-mask::${token}`);
  }

  await configureAndVerifyCurrency(region.webBaseUrl, token, region);

  console.log("\n  Bootstrap complete.\n");
}

main().catch((err) => {
  console.error("Bootstrap failed:", err);
  process.exit(1);
});
