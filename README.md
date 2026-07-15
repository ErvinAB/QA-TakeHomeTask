# Multi-Region Test Automation Framework

Production-style test automation framework for ParaBank's banking application, covering REST API and Web UI testing with region-switching capabilities.

## Why ParaBank

ParaBank provides a public banking web application and REST API backed by the same system. This makes it ideal for demonstrating cross-layer test patterns where a Web test reuses the API for setup or verification.

## Tech Stack

- **TypeScript** with strict mode
- **Playwright Test** for both API and Web projects
- **Playwright APIRequestContext** for REST API testing
- **Zod** for runtime response schema validation
- **ESLint** with typescript-eslint for linting
- **GitHub Actions** for CI
- **npm** with committed package-lock.json

## Prerequisites

- Node.js 20+ (see `.nvmrc`)
- npm

## Installation

```bash
nvm use          # if using nvm
npm ci
npx playwright install chromium
```

## Environment Configuration

Copy `.env.example` to `.env` and adjust as needed:

```bash
cp .env.example .env
```

### Region Switching

Select a region by setting the `REGION` environment variable:

```bash
REGION=eu npm run test:api
REGION=eu npm run test:web
REGION=us npm run test:all
```

### Environment Variable Overrides

Each region supports these environment variable overrides:

| Variable | Description | Default |
|----------|-------------|---------|
| `EU_WEB_BASE_URL` | EU web application URL | `https://parabank.parasoft.com/parabank` |
| `EU_API_BASE_URL` | EU API base URL | `https://parabank.parasoft.com/parabank/services/bank` |
| `EU_USERNAME` | EU demo username | `john` |
| `EU_PASSWORD` | EU demo password | `demo` |
| `US_WEB_BASE_URL` | US web application URL | `https://parabank.parasoft.com/parabank` |
| `US_API_BASE_URL` | US API base URL | `https://parabank.parasoft.com/parabank/services/bank` |
| `US_USERNAME` | US demo username | `john` |
| `US_PASSWORD` | US demo password | `demo` |

**Important:** Both EU and US profiles default to the same public ParaBank deployment because the application is not truly multi-region. The framework is designed so that real regional URLs can replace the defaults without modifying test specifications.

## Running Tests

```bash
# API only
REGION=eu npm run test:api

# Web only
REGION=eu npm run test:web

# Both API and Web
REGION=eu npm run test:all

# Lint and typecheck
npm run lint
npm run typecheck

# View HTML report
npm run report
```

## Repository Architecture

```
src/
├── api/
│   ├── clients/bank-api.client.ts    # Typed API client with business operations
│   ├── models/                        # Zod schemas for runtime validation
│   └── support/response.helper.ts     # Response validation and diagnostics
├── config/
│   ├── region.types.ts                # RegionConfig type definition
│   ├── region.loader.ts               # Region resolution with validation
│   └── regions/{eu,us}.ts             # Region-specific configurations
├── fixtures/test.fixture.ts           # Playwright typed fixtures
├── test-data/customer.factory.ts      # Unique test customer generation
└── web/pages/                         # Page objects for web elements

tests/
├── api/                               # API test specifications
└── web/                               # Web test specifications
```

## Test Scenario Matrix

| Requirement | Test File | Description |
|-------------|-----------|-------------|
| API happy path | `tests/api/authentication.spec.ts` | Login with valid credentials, validate customer schema |
| API error state | `tests/api/authentication.spec.ts` | Invalid credentials returns 400 with error message |
| API idempotency | `tests/api/account-idempotency.spec.ts` | Repeated GET yields identical stable fields |
| API schema validation | `tests/api/accounts.spec.ts` | Account array validated against Zod AccountArraySchema |
| Web happy path | `tests/web/authentication.spec.ts` | Login shows account overview |
| Web error state | `tests/web/authentication.spec.ts` | Invalid login shows error message |
| Web edge case | `tests/web/registration.spec.ts` | Duplicate registration rejected |
| Cross-layer test | `tests/web/api-assisted-account.spec.ts` | Register via web, create account via API, verify in web |

## Cross-Layer Test Explanation

The cross-layer test (`tests/web/api-assisted-account.spec.ts`) demonstrates genuine shared infrastructure:

1. Registers a unique customer through the Web UI
2. Authenticates the same customer via `BankApiClient`
3. Creates an additional account via the API
4. Reloads the Web account overview
5. Verifies the API-created account appears in the UI

This proves both layers operate against the same customer state.

## Schema Validation

Zod schemas validate API responses at runtime:

- **CustomerSchema** validates id, firstName, lastName, address, phoneNumber, ssn
- **AccountArraySchema** validates arrays of accounts with id, customerId, type (CHECKING/SAVINGS/LOAN), balance
- **TransactionSchema** validates transactions with id, accountId, type (Credit/Debit), date, amount, description

Schema failures produce detailed error messages showing exactly which field failed validation.

## CI Pipeline

The GitHub Actions workflow (`tests.yml`) provides:

- **Lint & Typecheck** gate (required)
- **API tests** run per region (eu, us)
- **Web tests** run per region (eu, us)
- Chromium installed only for Web jobs
- Artifact upload (JUnit, HTML report, traces, screenshots, videos)
- `workflow_dispatch` inputs for layer and region selection
- Zero `continue-on-error` on quality gates

## Reporting

- **Console** list reporter for real-time output
- **HTML** report at `playwright-report/`
- **JUnit** XML at `test-results/junit.xml`
- **Trace** on first retry
- **Screenshot** only on failure
- **Video** retained only on failure

## Test-Data Strategy

- Each mutation-heavy test generates unique customers using `createCustomer(region, testId)`
- Generated usernames include region, timestamp, and worker index to avoid collisions
- Public seeded users (john/demo) are used for read-only operations
- No database cleanup operations are called against the shared demo
- Passwords are never printed in test output

## Known Limitations

1. **Single public deployment:** Both EU and US regions default to the same ParaBank URL. Real multi-region testing requires actual regional deployments.

2. **No user deletion API:** ParaBank provides no endpoint to delete test customers. Over time, test-created accounts accumulate. This is acceptable for a demo but would require cleanup endpoints in production.

3. **Shared public environment:** Other users can affect test data. Tests are designed to be isolated and not depend on specific account balances.

4. **No idempotency keys for mutations:** The ParaBank transfer API does not expose idempotency keys. The idempotency test covers safe read operations. In production, mutation idempotency would be validated by replaying operation keys.

## Adding a New Region

1. Create `src/config/regions/ap.ts`:

```typescript
import type { RegionConfig } from "../region.types";

const apRegion: RegionConfig = {
  name: "ap",
  webBaseUrl: process.env.AP_WEB_BASE_URL ?? "https://parabank.parasoft.com/parabank",
  apiBaseUrl: process.env.AP_API_BASE_URL ?? "https://parabank.parasoft.com/parabank/services/bank",
  browserLocale: "en-AU",
  browserTimezone: "Australia/Sydney",
  credentials: {
    username: process.env.AP_USERNAME ?? "john",
    password: process.env.AP_PASSWORD ?? "demo",
  },
};

export default apRegion;
```

2. Register it in `src/config/region.loader.ts`:

```typescript
import apRegion from "./regions/ap";

const SUPPORTED_REGIONS: Record<string, RegionConfig> = {
  eu: euRegion,
  us: usRegion,
  ap: apRegion,
};
```

3. Add environment variables to `.env.example`:

```
AP_WEB_BASE_URL=https://your-ap-domain.com/parabank
AP_API_BASE_URL=https://your-ap-domain.com/parabank/services/bank
AP_USERNAME=john
AP_PASSWORD=demo
```

No test code changes are required.

## Production Hardening Recommendations

- **Ephemeral test environments** per region with automated provisioning and teardown
- **Region-specific secrets** stored in a secure vault (AWS Secrets Manager, HashiCorp Vault)
- **Test-data provisioning APIs** with guaranteed cleanup
- **Idempotency keys** for all financial mutations (transfers, payments)
- **Contract testing** against OpenAPI specs to catch breaking changes
- **Service virtualization** for unavailable downstream dependencies
- **Database/event-level verification** where API-only assertions are insufficient
- **Correlation IDs** for distributed tracing of test flows
- **Risk-based regional execution** (smoke on PR, full regression on release)
- **Observability integration** with test metrics dashboards

## Mobile Design

See [docs/mobile-integration.md](docs/mobile-integration.md) for the native mobile testing architecture proposal.
