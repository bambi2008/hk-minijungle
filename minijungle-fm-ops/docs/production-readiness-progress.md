# DR FOREST OPS Production Readiness Progress

## Scoring Rule

This score tracks readiness for real Hong Kong FM operations at 1,000+ living-green modules. It does not measure investor-demo polish.

## Baseline

- Date: 2026-07-14
- Baseline score: 28%
- Reason: The app has a strong investor-grade product frame and static MVP demo, but it still lacks production backend, database persistence, permissions, mobile technician workflows, device integrations, and operational data pipelines.

## Progress Log

### Step 1 - API Foundation

- Target score after completion: 31%
- Capability added: Node server API layer for portfolio health, asset index, and server-side operations events.
- Why this matters: Moves the platform from a pure static demo toward service-side data boundaries and event persistence.
- Still not solved: It is not a production database, not multi-user authentication, not mobile offline sync, not sensor ingestion, and not a real audit-grade event store.

### Step 2 - Production Data Model and Quality Gate

- Target score after completion: 35%
- Capability added: Shared production data model, normalized production seed, data-quality API, and automated relationship validation.
- Why this matters: The platform now has a testable entity map for clients, sites, living assets, modules, work orders, proof records, sensor readings, incidents, service slots, invoices, compliance items, inventory and operations events.
- What is objectively better: Broken references, duplicate IDs, invalid health scores, missing work-order/proof/sensor relationships and basic stock issues can now fail a test instead of hiding inside demo JSON.
- Still not solved: The data still lives in JSON files and JSONL events. Plant Pod records are aggregate counts, proof files lack object-storage hashes/URLs, sensors are not time-series ingestion, and auth/roles are not production-grade.

### Step 3 - Server-Side State Persistence v1

- Target score after completion: 40%
- Capability added: Server-side operations state snapshot, revision tracking, state summary API, and browser UI synchronization to the server state store.
- Why this matters: Core UI actions can now persist beyond one browser's localStorage and can be recovered from the local server runtime.
- What is objectively better: AI queue, work-order completion, proof approval, sensor acknowledgement, invoice payment, schedule confirmation, incident resolution, compliance clearance, quick tasks and audit events now have a server-side state path.
- Still not solved: This is a JSON-file state store, not a production database. It does not provide multi-user conflict control, authentication, access policy, tenant isolation, object storage, background jobs or high-availability deployment.

### Step 4 - Typed Action API and Revision Conflict Control

- Target score after completion: 45%
- Capability added: Server-side typed action endpoint for operational state changes, action reducer, action-level audit event creation, browser action queue, and optimistic revision conflict detection.
- Why this matters: The platform no longer relies only on full-state snapshot overwrite. Work-order completion, dispatch staging, proof approval, sensor acknowledgement, inventory reorder, invoice payment, schedule confirmation, incident resolution, compliance clearance, role switch, quick task updates, AI queueing and report actions now have explicit server action types.
- What is objectively better: Stale writes now return a 409 revision conflict instead of silently replacing newer server state. API and browser smoke tests verify typed action persistence and conflict behavior.
- Still not solved: Conflict handling is still single-node and file-backed. It is not a transactional database, does not provide row-level locks, user permissions, tenant isolation, mobile offline reconciliation, object-storage proof validation, or device-ingestion pipelines.

### Step 5 - SQLite Runtime Persistence v1

- Target score after completion: 50%
- Capability added: SQLite-backed runtime database for operations events, typed actions and state snapshots, with schema migration tracking and storage health API.
- Why this matters: Runtime operations are no longer stored as loose JSON/JSONL files. The app now has durable tables for event history, action history and state revision snapshots, which is a necessary bridge toward real operational data management.
- What is objectively better: `/api/storage` exposes backend type, migration version, SQLite table list, row counts and latest state revision. Automated API tests confirm the SQLite file is created and retains event, action and state rows.
- Still not solved: Static master data still lives in JSON files, and SQLite is only a single-node embedded database. This does not yet provide production PostgreSQL/MySQL deployment, tenant-level row policies, user authentication, backup/restore automation, sensor time-series ingestion or object-storage proof retention.

### Current Honest Score

- Production-readiness score: 50%
- Investor-demo score remains higher, but should not be mixed into the production-readiness score.
