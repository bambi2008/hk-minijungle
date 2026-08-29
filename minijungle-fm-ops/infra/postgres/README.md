# DR FOREST OPS production persistence

Production mode requires a managed PostgreSQL instance. SQLite remains available only for pilot/demo mode.

Required environment:

```text
DR_FOREST_ENV=production
DR_FOREST_STORAGE_BACKEND=postgres
DR_FOREST_DATABASE_URL=postgresql://...
```

The current adapter covers append-only operations events, state snapshots, actions, remediation tasks, preventive planning, workforce dispatch, inventory route-kit control, supplier-lot/expiry traceability, independently reviewed stock counts, background-job reliability records, physical-module commissioning, device calibration/fault/replacement history, client service contracts with asset coverage, versioned amendment/renewal approvals, immutable SLA commitments and derived attainment reports, a release evidence ledger for external production checks, and an explainable health score plus ESG operational ledger. It uses connection pooling, transactions, JSONB payloads and idempotent migrations. Evidence snapshots use migration v3 with SHA-256 fingerprints, an explicit unsigned/signed HMAC-SHA256 contract, verification state and retention expiry. The health endpoint reports the PostgreSQL migration and row counts.

Apply migrations in numeric order through `018_health_esg_operational_ledger.sql`. Production inventory, lot, stock-count, commissioning, device-lifecycle, service-contract, release-evidence and ESG tables are intentionally empty after migration; warehouse counts, supplier lots, module/device serial numbers, calibration records, physical installation records, signed contract terms, dated release artifacts and period observations must come from approved physical checks or controlled import. Contract version rows are created from the imported base terms; change requests remain pending until an authorized FM reviewer approves or rejects them. SLA links are created when remediation tasks are created, so attainment remains based on persisted task timestamps rather than dashboard estimates. Reliability job definitions are registered by the application, while run and incident rows are created only by actual executions. Health snapshots and ESG period ledgers are application evidence, not independent assurance.

Before a real launch, apply the remaining master-data, telemetry, device, alert, AI, session, audit, remediation-task, and evidence snapshot migrations in the same managed database. Do not point production at the pilot SQLite file. Use a separate database role with only schema migration and application privileges, enable TLS, private networking, automated point-in-time recovery, and connection limits.

The application deliberately reports `not-ready` until the production storage and identity/object-storage gates are configured. A passing local adapter smoke test is not evidence that the cloud database is reachable.
