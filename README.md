# Firefly III Multi-Region Test Automation

A multi-region test automation framework for [Firefly III](https://www.firefly-iii.org/) using TypeScript, Playwright, Zod validation, Docker self-hosting, and GitHub Actions CI.

## Why Firefly III

Firefly III is a self-hosted, open-source personal finance manager with a comprehensive REST API. It provides real financial-domain operations (accounts, transactions, budgets) that make test scenarios meaningful and realistic.

**Why not the public demo?** The Firefly III maintainers state the demo is for demonstration, not testing, and scripted requests may be blocked. This framework uses a self-hosted Docker instance for isolated, reproducible testing.

## Design Summary

- API and Web layers are independent — tests can run against either or both without code changes
- Region selection via `REGION` env var switches the entire stack (Docker project, port, credentials, database)
- Bootstrap uses Playwright to complete Firefly III's browser-only first-user registration and token creation
- Native currency is configured via the user-group API and verified after bootstrap
- Every API response is validated against a Zod schema at the client boundary
- Test data uses deterministic unique names combining region, CI run ID, test ID, and UUID fragment

## Two-Branch Strategy

| Branch | Target | Purpose |
|--------|--------|---------|
| `main` | Firefly III (Docker) | Primary solution with infrastructure isolation |
| `solution/parabank-public` | ParaBank (public demo) | Portability/reference implementation |

## Architecture

```
src/
├── api/
│   ├── clients/firefly-api.client.ts    # Typed API client
│   ├── models/                          # Zod schemas
│   └── support/response.helper.ts       # Response validation
├── config/
│   ├── region.types.ts                  # RegionConfig interface
│   ├── region.registry.ts               # Region definitions (single source of truth)
│   └── region.loader.ts                 # Region resolver + credential loading
├── fixtures/test.fixture.ts             # Playwright fixtures
├── test-data/factories.ts               # Test data generators
└── web/pages/                           # Page objects
tests/
├── api/                                 # API test specs
└── web/                                 # Web test specs
infra/firefly/compose.yml                # Docker Compose template
scripts/
├── environment.ts                       # Lifecycle management (init, up, down, destroy, ready, logs)
└── bootstrap.ts                         # Browser-based user/token provisioning
```

## Prerequisites

- Node.js >= 20
- Docker Desktop (or Docker Engine)
- Docker Compose v2

## Quick Start (macOS)

```bash
# 1. Verify Docker
docker info
docker compose version

# 2. Install dependencies
npm ci
npx playwright install chromium

# 3. Initialize runtime configuration
REGION=eu npm run env:init

# 4. Start Firefly III (EU)
REGION=eu npm run env:up

# 5. Bootstrap user and API token
REGION=eu npm run env:bootstrap

# 6. Run tests
REGION=eu npm run test:api
REGION=eu npm run test:web
REGION=eu npm run test:all

# 7. View report
npm run report

# 8. Stop (preserve data)
REGION=eu npm run env:down
```

## US Region

```bash
REGION=us npm run env:init
REGION=us npm run env:up
REGION=us npm run env:bootstrap
REGION=us npm run test:all
REGION=us npm run env:down
```

## Available Commands

| Command | Description |
|---------|-------------|
| `REGION=eu npm run env:init` | Generate runtime config |
| `REGION=eu npm run env:up` | Start environment (auto-inits if needed) |
| `REGION=eu npm run env:ready` | Wait for readiness |
| `REGION=eu npm run env:bootstrap` | Provision user and token |
| `REGION=eu npm run env:down` | Stop (keep data) |
| `REGION=eu npm run env:destroy -- --confirm` | Remove everything |
| `REGION=eu npm run test:api` | API tests only |
| `REGION=eu npm run test:web` | Web tests only |
| `REGION=eu npm run test:all` | All tests |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run report` | HTML report |

## Test Scenarios

### API Layer (15 tests)

- **Authentication**: About endpoint, current user, missing token (401), invalid token (401)
- **Accounts**: Create asset account, list, schema validation, nonexistent (401), idempotent reads, expense account, native currency check
- **Transactions**: Create withdrawal, list, direct retrieval by ID, idempotent reads

### Web Layer (4 tests)

- **Authentication**: Login happy path, invalid credentials error
- **Cross-Layer**: Create via API → verify in Web UI
- **Edge Case**: New account shows zero transactions

## CI Behavior

- **Automatic (PR/push)**: Quality gate → full EU/US × API/Web/All matrix (6 combinations)
- **Manual dispatch**: Selectable region (eu/us/all) and layer (api/web/all)
- Each matrix job: start Docker → bootstrap → test → diagnostics → destroy
- Stable `Required` job for branch protection

See [CI Strategy](docs/ci-strategy.md) for full details.

## Region Differences

| | EU | US |
|---|---|---|
| Locale | en-GB | en-US |
| Timezone | Europe/London | America/New_York |
| Currency | EUR | USD |
| Port | 8080 | 8081 |
| Compose project | qa-firefly-eu | qa-firefly-us |

## Inspecting Logs

```bash
REGION=eu npm run env:logs
```

## Resetting

```bash
REGION=eu npm run env:destroy -- --confirm
REGION=eu npm run env:init -- --force
REGION=eu npm run env:up
REGION=eu npm run env:bootstrap
```

## Links

- [Architecture Documentation](docs/architecture.md)
- [CI Strategy](docs/ci-strategy.md)
- [Target Selection](docs/target-selection.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Mobile Integration Design](docs/mobile-integration.md)
- [ParaBank Reference Implementation](../../tree/solution/parabank-public)
