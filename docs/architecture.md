# Architecture Document

## Architectural Goals

Build a maintainable, independently runnable multi-region test automation framework where:

- API and Web layers share infrastructure but run independently
- Region switching requires zero test-code modification
- Runtime schema validation catches API contract drift
- Cross-layer tests prove real system integration
- CI provides fast, reliable quality gates

## Module Boundaries

### Configuration Layer (`src/config/`)

The region system uses a **registry pattern** with typed configuration:

- `RegionConfig` defines the contract for region-specific values
- `region.loader.ts` resolves and validates region selection at startup
- Individual region files (`eu.ts`, `us.ts`) contain only data, no logic
- Unknown regions fail fast with actionable error messages

This design means adding a region is purely additive — no existing code changes.

### API Layer (`src/api/`)

Three clear responsibilities:

- **Models** (`models/`) define Zod schemas and infer TypeScript types from them. Schemas are the source of truth.
- **Client** (`clients/bank-api.client.ts`) provides business-focused operations. Every response passes through the response helper.
- **Support** (`support/response.helper.ts`) handles response reading, status checking, content-type verification, schema validation, and sensitive value redaction.

The response helper is designed to never consume the same response body twice and to produce clear diagnostics when validation fails.

### Web Layer (`src/web/pages/`)

Page objects model **interaction and element access**, not assertions. Assertions remain in tests for clarity. Locators use semantic selectors (by role, label, text, ID) and avoid fragile CSS chains or XPath.

### Fixture Layer (`src/fixtures/`)

Playwright fixtures compose all shared infrastructure:

- `region` — resolved `RegionConfig`
- `apiContext` — configured `APIRequestContext` (disposed after test)
- `bankApi` — `BankApiClient` using the API context
- `loginPage`, `registrationPage`, `accountsPage` — page objects wired with the region's web URL

The API context fixture is available in both API and Web test projects, enabling genuine cross-layer tests.

### Test Data (`src/test-data/`)

`CustomerFactory` generates unique customers using region name, timestamp, and test identifier. No global state is shared between tests.

## Why One Repository

A monorepo for API and Web tests is appropriate because:

- Both layers test the same system (ParaBank)
- Shared configuration, schemas, fixtures, and factories reduce duplication
- Cross-layer tests require importing from both layers
- CI can run independent quality gates from a single source

In a larger organization, separate repositories might be warranted when mobile and platform teams have different release cycles.

## Why Playwright Projects

Playwright Test provides:

- Built-in API testing via `APIRequestContext`
- Browser automation via Chromium
- Project-based test isolation
- Parallel execution with worker isolation
- Built-in retry, reporting, and artifact collection
- Strong TypeScript support

Using separate projects (not separate frameworks) means API and Web tests share the same runner, configuration, and fixture system while remaining independently runnable.

## Region Configuration Design

```
REGION env var → region.loader.ts → SUPPORTED_REGIONS registry → RegionConfig
                                    ↓ (if unknown) → Error with supported values
```

Environment variable overrides allow any region's URLs and credentials to be replaced without code changes. The system validates all required values at startup.

## Fixture Composition

```
test.extend<BankFixtures>
    ├── region (loadRegion)
    ├── apiContext (playwright.request.newContext)
    ├── bankApi (BankApiClient)
    ├── loginPage (LoginPage)
    ├── registrationPage (RegistrationPage)
    └── accountsPage (AccountsPage)
```

Fixtures use dependency injection — `bankApi` depends on `apiContext`, page objects depend on `page` and `region`. No mutable global state exists.

## API Client and Schema Boundaries

The `BankApiClient` methods return validated, typed objects. The flow is:

1. Make HTTP request via `APIRequestContext`
2. Pass raw `APIResponse` to `validateResponse()`
3. `validateResponse` checks status, content-type, parses JSON, validates against Zod schema
4. Returns `ValidatedResponse<T>` with typed `body`

Schema validation errors include the full response body (with sensitive fields redacted) and the specific Zod error path.

## Cross-Layer Setup Strategy

The cross-layer test proves real integration:

1. **Web UI registration** creates a new customer in the ParaBank database
2. **API authentication** confirms the customer exists and is accessible via the REST API
3. **API account creation** modifies state through the backend
4. **Web verification** confirms the UI reflects the API-created state

This is not a mock or stub — both layers operate against the same live system.

## Test-Data Isolation

- Each test generates unique customers using `createCustomer(region, testId)`
- Usernames incorporate region, timestamp, and test/worker ID
- Read-only tests use the public seeded user (john/demo)
- No shared mutable state between tests
- Tests are ordered independently

## Error and Idempotency Strategy

**Error testing:**
- Invalid credentials → HTTP 400 with text "Invalid username and/or password"
- Nonexistent account → HTTP 400 with text "Could not find account #XXXXX"
- Assertions validate exact status codes and error message content

**Idempotency testing:**
- Two identical GET requests for the same account return identical stable fields (id, customerId, type)
- Balance remains consistent between reads
- This is a safe read-only idempotency check

The ParaBank API does not expose idempotency keys for mutations. In a production banking API, transfer operations would be validated by replaying the same operation key and asserting exactly one transaction is recorded.

## CI Quality Gates

```
PR opened → lint-and-typecheck → api-tests (per region) + web-tests (per region)
```

- Lint and typecheck must pass before any tests run
- API and Web tests run in parallel per region
- No `continue-on-error` on required gates
- Artifacts uploaded on both success and failure
- Chromium installed only for Web jobs

## Public-Demo Constraints

- Single deployment serves both "regions"
- No user deletion endpoint
- Shared with other users
- No guaranteed data consistency
- Tests designed for isolation and resilience

## Trade-offs and Alternatives

| Decision | Chosen | Alternative | Reason |
|----------|--------|-------------|--------|
| Framework | Playwright Test | Cypress, Jest+Puppeteer | Native API testing, multi-project, strong TS |
| Schema validation | Zod | Joi, Yup, Ajv | TypeScript-first, small bundle, excellent inference |
| Page objects | Lightweight classes | Page Object Model base class | Avoids unnecessary hierarchy, keeps things explicit |
| Region config | Registry pattern | File-per-region with dynamic import | Simpler, statically analyzable, better error messages |
| CI | GitHub Actions | CircleCI, Jenkins | Integrated with GitHub, sufficient for this scope |

## Evolution in a Production Banking Environment

1. **Ephemeral test environments** provisioned per region via Terraform/CloudFormation
2. **Region-specific secrets** in AWS Secrets Manager or HashiCorp Vault
3. **Test-data APIs** for provisioning and cleanup with guaranteed isolation
4. **Contract testing** against OpenAPI specs in CI
5. **Service virtualization** for unavailable downstream services (payment processors, KYC providers)
6. **Correlation IDs** for tracing test flows across microservices
7. **Observability** with test metrics dashboards (pass rate, duration, flakiness)
8. **Risk-based execution** (smoke on PR, full regression on release)
9. **Database verification** where API-only assertions are insufficient
