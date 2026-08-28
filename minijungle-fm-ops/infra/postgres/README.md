# DR FOREST OPS production persistence

Production mode requires a managed PostgreSQL instance. SQLite remains available only for pilot/demo mode.

Required environment:

```text
DR_FOREST_ENV=production
DR_FOREST_STORAGE_BACKEND=postgres
DR_FOREST_DATABASE_URL=postgresql://...
```

The current adapter covers append-only operations events, state snapshots, actions, remediation tasks, preventive planning, workforce dispatch, inventory route-kit control, background-job reliability records and physical-module commissioning with connection pooling, transactions, JSONB payloads, and idempotent migrations. Evidence snapshots use migration v3 with SHA-256 fingerprints, an explicit unsigned/signed HMAC-SHA256 contract, verification state and retention expiry. The health endpoint reports the PostgreSQL migration and row counts.

Apply migrations in numeric order through `012_module_commissioning.sql`. Production inventory and commissioning tables are intentionally empty after migration; warehouse counts, module serial numbers and physical installation records must come from approved physical checks or controlled import. Reliability job definitions are registered by the application, while run and incident rows are created only by actual executions.

Before a real launch, apply the remaining master-data, telemetry, device, alert, AI, session, audit, remediation-task, and evidence snapshot migrations in the same managed database. Do not point production at the pilot SQLite file. Use a separate database role with only schema migration and application privileges, enable TLS, private networking, automated point-in-time recovery, and connection limits.

The application deliberately reports `not-ready` until the production storage and identity/object-storage gates are configured. A passing local adapter smoke test is not evidence that the cloud database is reachable.
