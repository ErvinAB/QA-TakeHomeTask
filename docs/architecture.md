# Architecture

## What I optimized for

- Region switching without changing test code
- API and Web layers that can run independently or together
- Fail-fast validation at every API boundary
- Simple local setup with Docker Compose

## Architecture boundaries

```
scripts/          → Environment lifecycle (environment.ts, bootstrap.ts)
src/config/       → Region registry (single source of truth), credential loading
src/api/          → Typed HTTP client + Zod schema validation
src/web/pages/    → Page objects for Playwright browser tests
src/fixtures/     → Playwright fixture wiring (dependency injection)
tests/            → Test specs only — no infrastructure logic
infra/            → Docker Compose template
```

Tests never import scripts. Scripts never import test code. The API client never assumes a specific region.

## Key decisions

1. **Browser-based bootstrap**: Firefly III has no noninteractive first-user registration API. Playwright registers the user, creates a Personal Access Token via the OAuth page, and validates it via the API. This runs once per environment.

2. **Single region registry** (`src/config/region.registry.ts`): Region definitions, port resolution, and validation live in one file. Every consumer reads from this single source of truth.

3. **Native currency via user-groups endpoint**: Firefly III v6.6.6 with `FIREFLY_III_LAYOUT=v1` does not expose individual currency API endpoints. Currency is configured by PUTing the user-group with the desired `primary_currency_id`.

4. **Zod at the client boundary**: Every `FireflyApiClient` method validates the response schema. Schema mismatches throw immediately rather than producing silent type errors downstream.

5. **Localhost-only Docker binding**: `127.0.0.1:${FIREFLY_PORT}:8080` prevents external access. Works in GitHub Actions runners and local development.

## Trade-offs

| Decision | Benefit | Cost |
|----------|---------|------|
| Browser-based bootstrap | Automates first-user and token setup for the pinned Firefly III v6.6.6 UI | Requires Chromium, adds ~15s |
| Localhost port binding | No external exposure | Cannot test from remote hosts |
| Per-response Zod validation | Contract drift caught immediately | Slight runtime overhead per request |
| MariaDB LTS tag (not pinned) | Always current LTS | Build may use different patch versions over time |

## What I deliberately did not build

- Multi-user or role-based testing (single-owner scope)
- Budget or bill test scenarios (focused on accounts + transactions)
- Real geographically deployed regional environments; EU and US are isolated local instances of the same Firefly version
- Visual regression or screenshot comparison
- Load or performance testing

## What I would add in a production framework

- Separate test users per region with defined roles
- Contract testing against an API spec (OpenAPI)
- Mutation testing for schema coverage
- Named test suites (smoke, regression, nightly)
- Slack/Teams notification on CI failure
- Ephemeral environments spun up per PR
