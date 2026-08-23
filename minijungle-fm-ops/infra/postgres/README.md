# DR FOREST OPS production persistence

Production mode requires a managed PostgreSQL instance. SQLite remains available only for pilot/demo mode.

Required environment:

```text
DR_FOREST_ENV=production
DR_FOREST_STORAGE_BACKEND=postgres
DR_FOREST_DATABASE_URL=postgresql://...
```

The current adapter covers append-only operations events, state snapshots, and actions with connection pooling, transactions, JSONB payloads, and idempotent migrations. The health endpoint reports the PostgreSQL migration and row counts.

Before a real launch, apply the remaining master-data, telemetry, device, alert, AI, session, audit, and evidence snapshot migrations in the same managed database. Do not point production at the pilot SQLite file. Use a separate database role with only schema migration and application privileges, enable TLS, private networking, automated point-in-time recovery, and connection limits.

The application deliberately reports `not-ready` until the production storage and identity/object-storage gates are configured. A passing local adapter smoke test is not evidence that the cloud database is reachable.
