# DR FOREST OPS Production Readiness Progress

## Scoring Rule

This score tracks readiness for real Hong Kong FM operations at 1,000+ living-green modules. It does not measure investor-demo polish.

Scoring is governed by `docs/progress-scoring-governance.md`. If architecture scaffold readiness and real production operations readiness differ, the production operations score is the official progress score.

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

### Step 6 - Auth, Role and Tenant Boundary v1

- Target score after completion: 55%
- Capability added: Server-side demo auth policy with principals, roles, client scope, permission checks and action-type allowlists.
- Why this matters: The platform now has a testable boundary for who can read portfolio data, who can see which client assets, who can write operations events and which action types a field technician may perform.
- What is objectively better: `/api/auth/context` exposes the current principal, `/api/auth/policy` exposes the role model, client viewers are filtered to their own client data, read-only viewers are blocked from writes, and field technicians cannot write outside assigned client scope. API smoke tests verify both allowed and denied paths.
- Still not solved: This is not production IAM. There is no password flow, SSO, MFA, signed session lifecycle, secret rotation, audit-grade login trail, row-level database policy or admin console for user management.

### Step 7 - Master Data DB Migration v1

- Target score after completion: 60%
- Capability added: SQLite master-data tables for clients, living assets, asset zones, work orders, proof records, sensor readings and incidents, seeded from existing JSON with foreign-key constraints.
- Why this matters: Core operational master data is no longer only read from JSON files. Portfolio, asset index and tenant-scope resolution now read from SQLite-backed master tables with enforceable relationships.
- What is objectively better: `/api/storage` exposes master-data migration version, table names, row counts and `PRAGMA foreign_key_check` status. API smoke tests verify client/asset/work-order/sensor table counts and zero foreign-key issues.
- Still not solved: JSON is still the seed source, and there is no admin CRUD workflow, bulk import UI, production backup/restore, schema migration runner, managed PostgreSQL/MySQL deployment, or historical versioning for master-data changes.

### Step 8 - Admin CRUD and Import Workflow v1

- Target score after completion: 65%
- Capability added: Permission-protected admin APIs for master-data validation, JSON seed import, and upsert workflows for clients, living assets, work orders and sensor readings.
- Why this matters: Master data can now be created or updated through backend APIs instead of being overwritten from JSON on every read. Successful admin writes create ops audit events, while invalid foreign-key writes are rejected.
- What is objectively better: API smoke tests verify read-only roles are blocked, valid admin client/asset/work-order/sensor upserts persist into SQLite, invalid asset-client references fail validation, portfolio/assets read paths reflect admin changes, and explicit import resets master data back to the seed baseline.
- Still not solved: There is still no visual admin CRUD UI, approval workflow, bulk CSV/XLSX importer, migration rollback tooling, master-data version history, soft delete/recovery model, or production database service.

### Step 9 - Technician Mobile Workflow and Offline Capture v1

- Target score after completion: 70%
- Capability added: Permission-protected mobile route API, technician offline capture batch sync API, SQLite tables for mobile capture batches/items, idempotent duplicate handling, client/wall/work-order scope validation, and mobile sync audit events.
- Why this matters: Field service can now produce structured operational evidence instead of relying only on browser state or static proof JSON. A technician can receive a scoped route, capture photos/refill/nutrient/health/exception records offline, and sync them back into the platform with a server-side audit trail.
- What is objectively better: API smoke tests verify that client viewers cannot sync mobile evidence, field technicians cannot sync outside their assigned client, mismatched wall/work-order/client payloads are rejected, valid offline batches persist into SQLite, repeated batch IDs do not duplicate rows or events, and `/api/storage` reports mobile capture table counts and foreign-key integrity.
- Still not solved: This is not a native mobile app. It does not yet upload real image files to object storage, hash media blobs, perform camera capture, geolocation proof, background retry, offline conflict resolution, push notifications, route navigation, or supervisor review workflow.

### Step 10 - Proof Object Storage and Media Evidence v1

- Original technical milestone target: 75% architecture scaffold readiness.
- Official production-readiness score after recalibration: 62%.
- Capability added: SQLite proof-media metadata ledger, upload-intent API, evidence-registration API, proof-media verification API, scoped media vault read API, object-key/SHA-256/byte-size tracking, relationship links to wall/work order/proof/mobile capture, and storage health reporting.
- Why this matters: Investor and FM users need evidence that can survive reporting, ESG packs, dispute handling and renewal conversations. The app now has a structured chain from technician capture to proof media object, hash, object key, verification status and audit event.
- What is objectively better: API smoke tests verify that clients can read only scoped proof media, clients cannot create or verify proof media, field technicians cannot create proof media outside assigned client scope, mismatched wall/work-order/client/proof relationships are rejected, hash mismatches are rejected, duplicate registration does not duplicate audit events, verified proof media is visible in the client vault, and `/api/storage` reports proof-media table counts, hash coverage and foreign-key integrity.
- Still not solved: This is still a local metadata ledger, not production cloud object storage. It does not yet provide actual file upload, signed S3/GCS/Azure Blob URLs, antivirus/malware scanning, image EXIF stripping, immutable bucket retention, CDN delivery, backup policy, or lifecycle deletion controls.

### Score Recalibration - Preventing Concept Drift

- Date: 2026-07-15
- Corrected official production-readiness score: 62%.
- What changed: Step scores were previously mixing architecture scaffold readiness with real production operations readiness. That was too optimistic.
- Why 62% is more accurate: The app now has important backend foundations, but it still lacks production database deployment, real technician mobile/offline UI, real object storage upload, sensor time-series ingestion, health scoring, production IAM, monitoring, backup/restore, support playbooks, and complete admin/client/auditor operational UI.
- Reporting rule going forward: Future progress must state the score before and after, the scoring dimensions improved, the evidence added, remaining production blockers, applicable hard caps, and whether the number refers to production readiness, architecture scaffold readiness or investor-demo readiness.

### Current Honest Score

- Production-readiness score: 62%
- Architecture scaffold readiness: roughly 70-75%, but this is not the official production-readiness score.
- Investor-demo score remains higher, but should not be mixed into the production-readiness score.
