# DR FOREST OPS No-Cost Staging Runbook

This runbook provides a temporary staging environment on the existing Hong Kong Lighthouse server. It adds no managed PostgreSQL charge and deliberately does not claim production readiness.

## What this environment is

- The app runs in pilot mode with SQLite and the local proof-media vault.
- Runtime files and local backups persist in Docker volumes.
- The server binds the app to `127.0.0.1:8010`; expose it only through an approved HTTPS reverse proxy or an SSH tunnel.
- Use synthetic records or approved internal test data only. Do not put real customer personal data, signed device keys or customer proof photos in this environment.
- The account's existing Lighthouse server is already running in Hong Kong. Its current subscription and expiry remain the owner's responsibility.

## Start the pilot app

From the project directory on the server:

```bash
cp .env.staging.example .env.staging
chmod 600 .env.staging
# Edit .env.staging and replace both pilot placeholders.
docker compose --env-file .env.staging -f docker-compose.staging.yml build
docker compose --env-file .env.staging -f docker-compose.staging.yml up -d
docker compose --env-file .env.staging -f docker-compose.staging.yml ps
curl --fail http://127.0.0.1:8010/api/health
curl --fail http://127.0.0.1:8010/api/health/ready
```

The pilot login is enabled only when `DR_FOREST_OPERATOR_EMAIL` and `DR_FOREST_OPERATOR_PASSWORD` are present. The browser can be opened through the server's approved HTTPS endpoint. Do not open port `5432` or `55432` to the public internet.

## Rehearse PostgreSQL migrations without buying TencentDB

The optional rehearsal container is separate from the pilot app. It validates the repository's PostgreSQL schema runner against a disposable local PostgreSQL 17 instance; it does not make the pilot app use PostgreSQL.

```bash
docker compose --env-file .env.staging -f docker-compose.postgres-rehearsal.yml up -d
docker compose --env-file .env.staging -f docker-compose.postgres-rehearsal.yml ps
export DR_FOREST_DATABASE_URL='postgresql://ops_staging:REPLACE_WITH_A_REHEARSAL_ONLY_PASSWORD@127.0.0.1:55432/dr_forest_ops_staging'
npm run migrate:postgres:schema -- --out ./evidence/staging-postgres-schema-apply.json
npm run verify:postgres:schema -- --out ./evidence/staging-postgres-schema-verify.json
```

On Windows PowerShell, replace the `export` line with:

```powershell
$env:DR_FOREST_DATABASE_URL = "postgresql://ops_staging:REPLACE_WITH_A_REHEARSAL_ONLY_PASSWORD@127.0.0.1:55432/dr_forest_ops_staging"
npm.cmd run migrate:postgres:schema -- --out .\evidence\staging-postgres-schema-apply.json
npm.cmd run verify:postgres:schema -- --out .\evidence\staging-postgres-schema-verify.json
```

The rehearsal database is not evidence of TencentDB availability, network isolation, backup retention or restore capability. Remove it after the migration check when it is no longer needed:

```bash
docker compose --env-file .env.staging -f docker-compose.postgres-rehearsal.yml down -v
```

## Stop and inspect

```bash
docker compose --env-file .env.staging -f docker-compose.staging.yml logs --tail=200 app
docker compose --env-file .env.staging -f docker-compose.staging.yml stop
docker compose --env-file .env.staging -f docker-compose.staging.yml down
```

Run the local backup contract before maintenance:

```bash
docker compose --env-file .env.staging -f docker-compose.staging.yml exec app npm run backup:runtime
```

That backup remains on the same server volume. It is not an off-host backup and cannot satisfy the production restore gate.

## Cutover to paid production infrastructure

Before accepting real customer data, stop the pilot app and complete all of the following in a separate production deployment:

1. Create Hong Kong TencentDB PostgreSQL and configure private networking and security groups.
2. Create a private COS bucket for proof and camera media, plus a separate encrypted backup destination.
3. Apply all PostgreSQL migrations and verify table relationships and row counts.
4. Configure enterprise OIDC, MFA, allowed origins, secrets and monitoring.
5. Run a real signed-device canary, an off-host backup/restore drill and repeated customer field cycles.
6. Switch `DR_FOREST_ENV=production` only after the release evidence ledger is independently reviewed.

The official production-operations score remains **65%** while those external checks are absent.
