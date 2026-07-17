# Troubleshooting

## Docker won't start

- Ensure Docker Desktop is running
- Run `docker info` to verify
- On macOS: restart Docker Desktop
- On Linux: `sudo systemctl start docker`

## Port already in use

```bash
# Check what's using the port
lsof -i :8080
# Kill the process or override the port with EU_PORT or US_PORT env vars
REGION=eu EU_PORT=9080 npm run env:up
```

Ports are overridden via `EU_PORT` or `US_PORT` environment variables at runtime. They are not changed inside `.runtime/eu.env`.

## Bootstrap fails

1. Check Firefly III logs: `REGION=eu npm run env:logs`
2. Verify readiness: `curl http://127.0.0.1:8080/api/v1/about`
3. Delete `.runtime/eu.token.txt` and re-run bootstrap
4. If credentials are corrupted, destroy and re-initialize (see below)

## Tests fail with connection refused

1. Verify Firefly is running: `docker compose -f infra/firefly/compose.yml -p qa-firefly-eu ps`
2. Check the port in your region config matches the running container
3. Try `REGION=eu npm run env:ready`

## Tests fail with 401

1. Token may be expired or invalid
2. Re-run bootstrap: `REGION=eu npm run env:bootstrap`
3. Check `.runtime/eu.token.txt` exists and is non-empty

## Reset everything

If a Docker volume already exists, you must destroy the environment before re-initializing. Regenerating `APP_KEY` or database credentials over an existing volume will break the running instance.

```bash
REGION=eu npm run env:destroy -- --confirm
REGION=eu npm run env:init -- --force
REGION=eu npm run env:up
REGION=eu npm run env:bootstrap
```
