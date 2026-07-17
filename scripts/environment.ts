import { randomBytes } from "crypto";
import { execSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync, chmodSync } from "fs";
import { join } from "path";
import { getRegion } from "../src/config/region.registry";
import type { RegionConfig } from "../src/config/region.types";

const RUNTIME_DIR = join(__dirname, "..", ".runtime");
const COMPOSE_FILE = join(__dirname, "..", "infra", "firefly", "compose.yml");

// ── Runtime-file generation ──────────────────────────────────────────

function generateKey(length = 32): string {
  return randomBytes(length).toString("hex").slice(0, length);
}

function generatePassword(length = 20): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  return Array.from(randomBytes(length))
    .map((b) => chars[b % chars.length])
    .join("");
}

function generateAppEnv(region: RegionConfig, appKey: string, dbPassword: string): string {
  return [
    `APP_ENV=production`,
    `APP_DEBUG=false`,
    `SITE_OWNER=qa@example.com`,
    `APP_KEY=${appKey}`,
    `DEFAULT_LANGUAGE=en_US`,
    `DEFAULT_LOCALE=${region.serverLocale}`,
    `TZ=${region.browserTimezone}`,
    `TRUSTED_PROXIES=**`,
    `LOG_CHANNEL=stack`,
    `APP_LOG_LEVEL=notice`,
    `AUDIT_LOG_LEVEL=emergency`,
    `DB_CONNECTION=mysql`,
    `DB_HOST=db`,
    `DB_PORT=3306`,
    `DB_DATABASE=${region.dbDatabase}`,
    `DB_USERNAME=${region.dbUsername}`,
    `DB_PASSWORD=${dbPassword}`,
    `DB_SOCKET=`,
    `CACHE_DRIVER=file`,
    `SESSION_DRIVER=file`,
    `COOKIE_PATH=/`,
    `COOKIE_DOMAIN=`,
    `COOKIE_SECURE=false`,
    `COOKIE_SAMESITE=lax`,
    `MAIL_MAILER=log`,
    `MAIL_HOST=null`,
    `MAIL_PORT=2525`,
    `MAIL_FROM=changeme@example.com`,
    `MAIL_USERNAME=null`,
    `MAIL_PASSWORD=null`,
    `MAIL_ENCRYPTION=null`,
    `AUTHENTICATION_GUARD=web`,
    `STATIC_CRON_TOKEN=${generateKey(32)}`,
    `DKR_CHECK_SQLITE=true`,
    `APP_NAME=FireflyIII`,
    `BROADCAST_DRIVER=log`,
    `QUEUE_DRIVER=sync`,
    `CACHE_PREFIX=firefly`,
    `FIREFLY_III_LAYOUT=v1`,
    `APP_URL=http://127.0.0.1:${region.port}`,
    `TRACKER_SITE_ID=`,
    `TRACKER_URL=`,
    ``,
  ].join("\n");
}

function generateDbEnv(region: RegionConfig, dbPassword: string): string {
  return [
    `MARIADB_DATABASE=${region.dbDatabase}`,
    `MARIADB_USER=${region.dbUsername}`,
    `MARIADB_PASSWORD=${dbPassword}`,
    `MARIADB_RANDOM_ROOT_PASSWORD=true`,
    ``,
  ].join("\n");
}

function initRegion(region: RegionConfig, force: boolean): boolean {
  const appEnvPath = join(RUNTIME_DIR, `${region.name}.env`);
  const dbEnvPath = join(RUNTIME_DIR, `${region.name}.db.env`);
  const credsPath = join(RUNTIME_DIR, `${region.name}.creds.json`);

  const allExist = existsSync(appEnvPath) && existsSync(dbEnvPath) && existsSync(credsPath);
  if (!force && allExist) {
    console.log(`  ⊘ ${region.name.toUpperCase()}: already initialized (use --force to regenerate)`);
    return false;
  }

  if (allExist && force) {
    console.log(`  ⚠ ${region.name.toUpperCase()}: overwriting existing files`);
    console.log(`    If a Docker volume already exists, destroy first: REGION=${region.name} npm run env:destroy -- --confirm`);
  }

  const appKey = generateKey(32);
  const dbPassword = generatePassword(20);
  const testPassword = generatePassword(16);

  writeFileSync(appEnvPath, generateAppEnv(region, appKey, dbPassword), { mode: 0o600 });
  writeFileSync(dbEnvPath, generateDbEnv(region, dbPassword), { mode: 0o600 });
  writeFileSync(credsPath, JSON.stringify({
    testEmail: region.defaultTestEmail,
    testPassword,
    dbPassword,
  }, null, 2), { mode: 0o600 });

  for (const p of [appEnvPath, dbEnvPath, credsPath]) {
    try { chmodSync(p, 0o600); } catch { /* Windows */ }
  }

  console.log(`  ✓ ${region.name.toUpperCase()}: runtime files created (port ${region.port})`);
  return true;
}

// ── Docker Compose wrapper ───────────────────────────────────────────

function composeEnv(region: RegionConfig): NodeJS.ProcessEnv {
  return {
    ...process.env,
    FIREFLY_PORT: String(region.port),
    FF_ENV_FILE: join(RUNTIME_DIR, `${region.name}.env`),
    FF_DB_ENV_FILE: join(RUNTIME_DIR, `${region.name}.db.env`),
  };
}

function dockerCompose(args: string, region: RegionConfig): string {
  const cmd = `docker compose -f "${COMPOSE_FILE}" -p ${region.composeProjectName} ${args}`;
  return execSync(cmd, {
    encoding: "utf-8",
    timeout: 120_000,
    stdio: "pipe",
    env: composeEnv(region),
  });
}

function dockerComposeSafe(args: string, region: RegionConfig): string {
  try {
    return dockerCompose(args, region);
  } catch (err: unknown) {
    const e = err as { stderr?: string; stdout?: string };
    return e.stderr ?? e.stdout ?? String(err);
  }
}

// ── Readiness ────────────────────────────────────────────────────────

function waitForReadiness(region: RegionConfig, timeoutSec = 120): void {
  const url = `http://127.0.0.1:${region.port}`;
  const start = Date.now();
  let lastStatus = "none";

  console.log(`  Waiting for Firefly III on port ${region.port}...`);

  while (Date.now() - start < timeoutSec * 1000) {
    try {
      const raw = execSync(
        `curl -s -o /dev/null -w '%{http_code}' -L --max-redirs 5 "${url}/login" 2>/dev/null`,
        { encoding: "utf-8", timeout: 10_000 }
      ).trim();
      const code = parseInt(raw, 10);
      lastStatus = isNaN(code) ? raw : String(code);

      if (!isNaN(code) && code >= 200 && code < 300) {
        console.log(`  ✓ Firefly III is ready (HTTP ${code})`);
        return;
      }

      if (!isNaN(code) && code >= 400) {
        console.log(`\n  ✗ Firefly III returned HTTP ${code}`);
        showDiagnostics(region);
        process.exit(1);
      }
    } catch {
      // connection refused, not ready yet
    }
    execSync("sleep 3");
  }

  console.log(`\n  ✗ Firefly III did not become ready within ${timeoutSec}s`);
  console.log(`  Last observed HTTP status: ${lastStatus}`);
  showDiagnostics(region);
  process.exit(1);
}

function showDiagnostics(region: RegionConfig): void {
  console.log("\n  Docker Compose status:");
  console.log(dockerComposeSafe("ps", region));
  console.log("\n  Firefly III logs (last 100 lines):");
  console.log(dockerComposeSafe("logs --tail=100 app", region));
  console.log("\n  MariaDB logs (last 50 lines):");
  console.log(dockerComposeSafe("logs --tail=50 db", region));
}

// ── Actions ──────────────────────────────────────────────────────────

function cmdInit(region: RegionConfig, force: boolean): void {
  if (!existsSync(RUNTIME_DIR)) {
    mkdirSync(RUNTIME_DIR, { recursive: true });
  }
  console.log(`\n=== Initializing runtime files (${region.name.toUpperCase()}) ===\n`);
  initRegion(region, force);
  console.log("");
}

function cmdUp(region: RegionConfig): void {
  console.log(`\n=== Starting Firefly III (${region.name.toUpperCase()}) ===\n`);

  const envFile = join(RUNTIME_DIR, `${region.name}.env`);
  const dbEnvFile = join(RUNTIME_DIR, `${region.name}.db.env`);
  const credsFile = join(RUNTIME_DIR, `${region.name}.creds.json`);
  if (!existsSync(envFile) || !existsSync(dbEnvFile) || !existsSync(credsFile)) {
    console.log("  Runtime files not found. Initializing...");
    initRegion(region, false);
  }

  console.log("  Pulling images...");
  dockerCompose("pull", region);
  console.log("  Starting containers...");
  dockerCompose("up -d", region);
  waitForReadiness(region);
  console.log("");
}

function cmdDown(region: RegionConfig): void {
  console.log(`\n=== Stopping Firefly III (${region.name.toUpperCase()}) ===\n`);
  dockerCompose("down", region);
  console.log("  ✓ Containers stopped (volumes preserved)\n");
}

function cmdDestroy(region: RegionConfig, confirm: boolean): void {
  if (!confirm) {
    console.log("\n  ✗ Destruction requires --confirm flag\n");
    process.exit(1);
  }
  console.log(`\n=== Destroying Firefly III (${region.name.toUpperCase()}) ===\n`);
  dockerCompose("down -v", region);
  console.log("  ✓ Containers and volumes removed\n");
}

function cmdLogs(region: RegionConfig): void {
  dockerCompose("logs --tail=100 -f", region);
}

// ── Main dispatch ────────────────────────────────────────────────────

function main(): void {
  const region = getRegion();
  const validActions = ["init", "up", "ready", "logs", "down", "destroy"] as const;
  type Action = (typeof validActions)[number];
  const raw = process.argv.find((a) => (validActions as readonly string[]).includes(a));
  const action: Action = (raw as Action) ?? "up";
  const force = process.argv.includes("--force");
  const confirm = process.argv.includes("--confirm");

  switch (action) {
    case "init": cmdInit(region, force); break;
    case "up": cmdUp(region); break;
    case "ready": waitForReadiness(region); break;
    case "logs": cmdLogs(region); break;
    case "down": cmdDown(region); break;
    case "destroy": cmdDestroy(region, confirm); break;
  }
}

main();
