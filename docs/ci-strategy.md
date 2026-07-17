# CI Strategy

## Workflow overview

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on pushes to `main` and pull requests. It executes up to **six test combinations** across two regions and three layer modes:

| # | Region | Layer | Command |
|---|--------|-------|---------|
| 1 | EU | API | `REGION=eu npm run test:api` |
| 2 | EU | Web | `REGION=eu npm run test:web` |
| 3 | EU | All | `REGION=eu npm run test:all` |
| 4 | US | API | `REGION=us npm run test:api` |
| 5 | US | Web | `REGION=us npm run test:web` |
| 6 | US | All | `REGION=us npm run test:all` |

Each combination runs on a **fresh GitHub runner** with its own isolated Docker environment.

## Automatic execution (PR/push)

All six combinations run automatically. Failures in one combination do not cancel the others (`fail-fast: false`).

## Manual execution (workflow_dispatch)

Select region and layer from the dropdown:

| region | layer | Result |
|--------|-------|--------|
| eu | api | EU API only |
| eu | web | EU Web only |
| eu | all | EU All (API + Web together) |
| us | api | US API only |
| us | web | US Web only |
| us | all | US All (API + Web together) |
| all | api | EU API + US API |
| all | web | EU Web + US Web |
| all | all | All six combinations |

The `all` layer runs `test:all`, which executes API and Web tests together in a single Playwright invocation.

## Job structure

1. **Prepare Matrix** — converts event inputs into region/layer JSON arrays for the matrix.
2. **Quality** — `npm ci` + `npm run lint` + `npm run typecheck`. Gates all test jobs.
3. **Test** — matrix of `region × layer`. Each cell: checkout → Node → npm ci → Chromium → Docker verify → env:init → env:up → env:bootstrap → test → diagnostics → destroy.
4. **Required** — stable status check for branch protection. Depends on Quality and all Test jobs.

## Environment isolation

- EU and US use separate Docker Compose projects (`qa-firefly-eu`, `qa-firefly-us`).
- Different ports (EU: 8080, US: 8081), databases, users, and tokens.
- Runtime credentials and tokens are generated inside each job.
- `.runtime/` is gitignored and never committed or uploaded as an artifact.
- No repository secrets are required; all credentials are locally generated.

## Artifacts

On every test run (pass or fail), artifacts are uploaded:

- `test-results/` — Playwright trace files and failure screenshots
- `playwright-report/` — HTML test report
- `diagnostics/` — sanitized Docker Compose status and Firefly III logs

Artifacts are retained for **7 days**. Docker logs are sanitized to exclude lines containing credential patterns (APP_KEY, passwords, secrets).

## Required gate

The **Required** job is the single status check for branch protection. It:

- Depends on Quality and the full test matrix
- Fails if Quality fails
- Fails if any selected test job fails or is cancelled
- Succeeds only when every selected combination passes
- Uses `if: always()` to evaluate dependency results even on partial failure

## Verification note

An actual GitHub Actions run has not been verified. The CI configuration is based on local test results and Docker Compose setup. Pushing the workflow to GitHub is required for live verification.
