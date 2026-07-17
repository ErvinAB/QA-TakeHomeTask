# Target Selection

## Firefly III (Primary)

Firefly III is the primary test target because:

1. **Controlled environment**: Self-hosted via Docker with full infrastructure ownership
2. **Real isolation**: EU and US run two separate Docker stacks with independent databases, users, and tokens
3. **Deterministic data**: EU and US never share state with each other. GitHub Actions jobs start with fresh runner state. Local state persists between runs until `env:destroy` is executed.
4. **Financial domain**: Real accounts, transactions, and monetary operations
5. **API + Web**: Both layers available for cross-layer testing
6. **Pinned application version**: Firefly III is pinned to `fireflyiii/core:version-6.6.6`. MariaDB uses `mariadb:lts`, which is a moving LTS tag, not a fixed version.

EU and US are two isolated instances of the same Firefly III version, not real geographic deployments. Local Docker volumes persist between runs until explicitly destroyed with `npm run env:destroy`.

## ParaBank (Reference)

ParaBank demonstrates framework portability to a different banking application. It runs against a public demo instance, which means:

- Both EU and US regions share the same backend
- Test data is not isolated
- The public instance may be reset or rate-limited
- No real multi-region infrastructure

## Why Not Automate the Firefly III Public Demo

The Firefly III maintainers explicitly state the demo at `https://demo.firefly-iii.org` is for demonstration, not testing. Scripted requests may be blocked. Self-hosting via Docker provides a reliable, reproducible testing environment.
