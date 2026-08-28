# DR FOREST OPS production persistence

Production mode requires a managed PostgreSQL instance. SQLite remains available only for pilot/demo mode.

Required environment:

```text
DR_FOREST_ENV=production
DR_FOREST_STORAGE_BACKEND=postgres
DR_FOREST_DATABASE_URL=postgresql://...
```

The current adapter covers append-only operations events, state snapshots, actions, remediation tasks, preventive planning, workforce dispatch and inventory route-kit control with connection pooling, transactions, JSONB payloads, and idempotent migrations. Evidence snapshots use migration v3 with SHA-256 fingerprints, an explicit unsigned/signed HMAC-SHA256 contract, verification state and retention expiry. The health endpoint reports the PostgreSQL migration and row counts.

Apply migrations in numeric order through `010_inventory_route_kits.sql`. Production inventory tables are intentionally empty after migration; warehouse counts, technician kits and opening balances must come from an approved physical count or controlled import.

Before a real launch, apply the remaining master-data, telemetry, device, alert, AI, session, audit, remediation-task, and evidence snapshot migrations in the same managed database. Do not point production at the pilot SQLite file. Use a separate database role with only schema migration and application privileges, enable TLS, private networking, automated point-in-time recovery, and connection limits.

The application deliberately reports `not-ready` until the production storage and identity/object-storage gates are configured. A passing local adapter smoke test is not evidence that the cloud database is reachable.
