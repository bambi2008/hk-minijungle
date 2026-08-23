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

- Production-readiness score: 65%
- Architecture scaffold readiness: roughly 70-75%, but this is not the official production-readiness score.
- Investor-demo score remains higher, but should not be mixed into the production-readiness score.

### Step 11 - Pilot Field Evidence Loop v1

- Official score: 62% -> 64% production operations readiness.
- Scope: One controlled client/site pilot. This is not a 1,000+ module deployment claim.
- Capability added: The backend now accepts actual proof-media bytes (JPEG, PNG, WebP or PDF), enforces a 5 MB pilot limit, recomputes and checks SHA-256 and byte size against the approved upload intent, writes the file to a server-local evidence vault, and only serves the file through the existing role/client-scope checks. A dedicated mobile field page now lets a scoped technician load an assigned route, record water/nutrient/visual-health/notes, capture a camera photo, save an offline queue locally, then sync the visit record and linked proof upload.
- Evidence added: Automated API smoke testing uploads real bytes, reads the protected file as the scoped client and compares the returned bytes. Local HTTP checks confirmed `/`, `/mobile.html`, `/mobile.css`, `/mobile.js`, `/assets/dr-forest-logo.png` and `/api/mobile/route` all returned HTTP 200 from the preview server.
- Why the increase is limited: It closes more of the field-to-proof workflow than metadata-only intent registration and provides an actual technician-facing capture surface. It does not add production cloud storage, a managed database, backups, production IAM or device telemetry.
- Remaining blockers: Local disk storage has no managed retention, malware scanning, encryption/key management, disaster recovery or signed external access. Mobile offline storage is browser localStorage only: no service worker, device management, retry scheduler, geolocation, MDM, native app packaging or conflict-reconciliation UI. The field identity is still a demo principal rather than a real authenticated session.
- Hard caps still active: No production managed database and backup/restore means the official score cannot exceed 65%. No managed object storage means it cannot exceed 66%. No sensor time-series/health pipeline means it cannot exceed 67%. No production IAM means it cannot exceed 70%.

### Step 12 - Pilot Reliability, Telemetry History and Session v1

- Official score: 64% -> 65% production operations readiness.
- Capability added: Readiness probe, SQLite and local evidence backup/restore scripts with integrity manifest, append-only sensor telemetry history, idempotent sensor ingestion, scoped sensor-history reads, sensor-stability snapshots, browser service-worker caching, automatic offline queue retry, pilot password-hash login sessions and logout.
- Evidence added: Full `npm run check` passes syntax checks, data-model validation, API smoke tests, session login, scope enforcement, telemetry history, duplicate timestamp handling, sensor score snapshots, real media upload/readback and existing UI smoke tests. Backup creation also passed against the runtime database.
- Why the increase is limited: These changes make a controlled pilot more recoverable and observable, but the runtime is still SQLite on one server. The hard cap is reached because a managed production database and automated off-host backup/restore are not yet deployed.
- Remaining blockers: Configure a real operator identity through deployment secrets, migrate to managed PostgreSQL or equivalent, move evidence to managed object storage, add malware scanning and retention, integrate a real IdP/SSO/MFA, connect authenticated sensor gateways, and prove the workflow with real client sites and repeated service cycles.
- Hard caps still active: Managed production database/backup cap at 65%, managed object-storage cap at 66%, production IAM cap at 70%, complete operational UI cap at 72%, and multi-client pilot evidence cap at 78%.

### Step 13 - Master Data Operator UI v1

- Official score: remains 65% because the managed-database/backup hard cap is already binding.
- Capability added: A dedicated `/admin.html` operator surface now reads scoped clients, living assets, work orders and sensor latest values from the backend, supports permission-protected create/edit forms, and gives the user a visible audit-event confirmation after a write. The main console links to this surface.
- Evidence added: Browser verification loaded the page, resolved the FM Lead identity, rendered all four client rows, switched to the Living Assets tab, and reported no console errors. Local HTTP resource checks passed for the page, CSS, JS and master-data API.
- Why the score does not increase: A visual CRUD surface closes a usability gap, but it does not remove the active managed database/backup cap and has not yet been used by a real FM team against repeated client operations.

### Step 14 - Module Telemetry, Mobile Actions and Concise Ops UI v1

- Official score: remains 65% because the managed-database/backup hard cap is still binding.
- Capability added: A real `asset_modules` SQLite table with wall/client foreign-key relationships, generated pilot module identities, per-module device configuration for temperature, humidity, CO2, MC and camera, module-scoped telemetry history, module-scoped proof photos, and module-aware mobile capture batches.
- Capability added: Reminder records now expose a `mobileAction` contract and are completed through a persisted `mobile_reminder_actions` table. The technician page can start a reminder, select a module, review the four latest device metrics, capture a photo, sync or queue offline, and mark the reminder completed.
- Capability added: `/operations.html` provides a deliberately concise Today view for open reminders, field route, module/device gaps and direct technician actions. The investor console and FiveCrop/FiveApp remain untouched.
- Evidence added: `npm run check` passes syntax checks, data-model validation, API smoke tests and UI smoke tests. API smoke now verifies module counts and foreign-key health, module-scoped capture, module telemetry configuration, a reminder-to-mobile action path and persisted reminder completion.
- Honest boundary: generated module IDs are placeholders derived from current wall module counts, not proof that hardware is installed. Device readings are not fabricated; an unconnected device is shown as no data. The pilot mobile app is still a browser/PWA surface, not a managed native application.
- Remaining blockers: register real module/device/camera IDs, connect authenticated gateways, define calibrated site thresholds, move telemetry to a managed time-series path, deploy managed database and off-host backup, move proof bytes to managed object storage, complete production IAM/SSO/MFA, and run repeated multi-client operations.

### Step 15 - Device Registry and Ingestion Ports v1

- Official score: remains 65% because the managed-database/backup hard cap is still binding.
- Capability added: A persistent `asset_devices` registry now maps temperature, humidity, CO2, MC and camera endpoints to each module. Device keys are stored as hashes, device status and last-seen timestamps are tracked, and registration/update is permission-protected in the Admin Data surface.
- Capability added: `POST /api/device-ingestion/readings` accepts one or a batch of readings with per-device metric restrictions, module/client scope validation and idempotent replay handling. `POST /api/device-ingestion/camera-captures` accepts camera metadata or a pilot image payload, stores a local integrity-checked file when supplied, and exposes protected readback/list ports.
- Capability added: `/api/device-health` and `/api/health/ready` report device counts, ingestion records, camera captures, stale active devices and foreign-key integrity. The external port contract is documented in the technician app product spec.
- Evidence added: `npm run check` includes `scripts/device-ingestion-smoke-test.mjs`, which registers simulator devices, publishes a temperature reading, verifies duplicate suppression, stores and reads back a camera file, checks module telemetry history and confirms missing device keys return HTTP 401.
- Honest boundary: generated simulator/pending rows are mappings derived from module configuration, not proof that hardware is installed. The current device key is a pilot shared secret; production needs gateway certificates or managed secret rotation, replay protection, network policy, calibrated thresholds, managed time-series storage and managed object storage.

### Step 16 - Telemetry Alert and AI Vision Operations Loop v1

- Official score: remains 65% because the managed-database/backup hard cap is still binding.
- Capability added: SQLite alert rules and alert instances with module/client scope, calibrated min/max thresholds, severity, occurrence merging, acknowledgement, resolution and audit events. Device and authenticated telemetry ingestion now evaluates enabled rules after a successful reading.
- Capability added: AI visual diagnosis task records linked to camera captures. The provider contract supports `queued`, `running`, `completed` and `failed` states, provider/model/confidence fields, evidence-only result JSON and a controlled result callback. No unexecuted AI result is presented as a diagnosis.
- Capability added: `/operations.html` now shows active sensor alerts and queued AI vision tasks. `/admin.html` now provides an Alert rules tab. Batch device ingestion now commits telemetry, idempotency logs and alert evaluation in bounded SQLite transactions, rather than reopening the database for every reading.
- Evidence added: `scripts/alert-ai-scale-smoke-test.mjs` creates a calibrated rule, triggers and merges an out-of-range alert, acknowledges and resolves it, uploads a camera capture, queues and completes an AI task, then accepts 1,000 readings in 10 batches. The latest full check accepted all 1,000 readings, retained 1,002 telemetry rows and completed in 3.316 seconds in the local pilot runtime.
- Honest boundary: the threshold values in the smoke test are test fixtures, not Hong Kong horticulture recommendations; AI completion is a provider callback contract, not a connected model; SQLite/local files remain pilot storage. Production still needs managed database/time-series/object storage, signed device requests, a real AI provider with evaluation governance, alert ownership/SLA policy and repeated multi-client field evidence.

### Step 17 - Production Gate, OIDC, Signed Devices, PostgreSQL Runtime and Encrypted Off-host Backup Contracts v1

- Official score: remains 65% production operations readiness.
- Capability added: `lib/ops-production-config.mjs` provides a fail-closed production gate. In `DR_FOREST_ENV=production`, the service requires a managed PostgreSQL URL, S3-compatible storage, encrypted off-host backup, OIDC issuer/JWKS/audience, HTTPS browser origins, HMAC device signing and explicit PostgreSQL/S3 backend selections. `/api/health/ready` returns HTTP 503 with the exact missing checks instead of presenting the pilot runtime as production-ready.
- Capability added: production OIDC bearer tokens are verified against configured JWKS using RS256, issuer, audience, expiry and not-before checks. Demo principals and pilot login are disabled in production. API/static responses now include request IDs, security headers, a restrictive content policy and browser-origin checks for cookie mutations. Login and device-ingestion endpoints have bounded in-process rate limits for pilot protection.
- Capability added: production device ingestion supports `device-id`, timestamp, nonce and HMAC-SHA256 request signatures over the request body hash. Nonces are persisted and rejected on reuse. Pilot shared-key requests remain compatible for controlled local testing.
- Capability added: `lib/ops-postgres-store.mjs` and `infra/postgres/001_runtime_schema.sql` provide a real node-postgres connection-pool/transaction/JSONB runtime adapter for operations events, state snapshots and actions. Server runtime operations select PostgreSQL in production and SQLite only in pilot mode.
- Capability added: runtime backups can encrypt database/media files with AES-256-GCM, preserve plaintext and ciphertext hashes, verify/decrypt before restore, support `--verify-only`, and upload an encrypted backup tree to an S3-compatible `s3://bucket/prefix` destination. A restore without a matching key or checksum fails closed.
- Capability added: the production gate also requires explicit `verified` evidence markers for full PostgreSQL migration, off-host restore, real signed-device pilot, repeated multi-client operations, monitoring, AI provider evaluation and media malware scanning. These markers are release evidence, not demo flags.
- Evidence added: `npm run check` passed syntax checks, data-model validation, fail-closed production-gate smoke, PostgreSQL adapter skip smoke (no local connection string), API smoke, device smoke, alert/AI scale smoke with 1,000 readings, generic smoke and UI smoke. Encrypted backup creation and verify-only restore passed. Playwright verification on port 8026 loaded operations/mobile/admin pages with no console errors; security headers were present. A production-mode server on port 8028 correctly returned HTTP 503 with 14 missing dependency checks.
- Why the score does not increase yet: no managed PostgreSQL instance, S3 bucket, OIDC tenant, real device fleet or off-host backup destination is connected in this workspace. The PostgreSQL adapter currently covers the operations runtime path; master data, telemetry, devices, alerts, AI records and sessions still require their production migrations/adapter paths before a real production switch. A code adapter and a green local contract test are not evidence of a live cloud service. The release gate intentionally remains blocked until the real-world evidence markers are verified.
- Hard caps still active: the production database/backup cap remains 65% until a live managed database and a successful off-host restore drill are evidenced. Object-storage, production-IAM, monitoring/recovery and multi-client-pilot caps also remain active. The official score must not be reported as 80% until those external dependencies and repeated field operations are actually verified.

### Current Honest Score After Step 17

- Production operations readiness: **65%**.
- Architecture scaffold readiness: approximately **78%**, including production gate, OIDC/JWKS verifier, signed-device contract, PostgreSQL runtime adapter and encrypted backup contract. This is not the official score.
- Investor-demo readiness: higher, and separate from production operations readiness.

### Step 18 - Full SQLite-to-PostgreSQL Schema and Data Migration v1

- Official score: remains 65% because the managed database and off-host restore hard cap still requires a live service and evidence, not only a migration tool.
- Capability added: `scripts/migrate-sqlite-to-postgres.mjs` introspects every table currently created by the SQLite stores, including clients, assets, modules, work orders, proof, mobile captures, reminders, telemetry history, health scores, devices, camera captures, alert rules/instances, AI diagnoses, sessions and ops runtime tables.
- Capability added: the migrator creates PostgreSQL columns, primary keys, unique indexes and foreign-key constraints from SQLite metadata, copies data inside a transaction with conflict-safe upserts, records a source database SHA-256 in `ops_migration_runs`, and reports source/copy row counts. `--dry-run` provides a no-write inventory before a cloud migration.
- Evidence added: the current pilot runtime dry-run discovered **27 production data tables**, their columns, foreign-key counts and row counts. The package check now runs this dry-run together with all existing API/device/alert/AI/1,000-reading/UI checks.
- Honest boundary: this migration path is now executable, but it has not been run against a real PostgreSQL instance in this workspace. The application’s non-runtime data stores still need production read/write switching and the live migration needs relationship/count verification, backup/restore evidence and staged rollback planning.
- Target effect: architecture scaffold moves from roughly 78% toward 82%; official production score remains **65%** until the live database and recovery evidence are supplied.

### Step 19 - Proof Media S3 Runtime Path v1

- Official score: remains 65% until a real private bucket upload/readback and malware/retention evidence are completed.
- Capability added: proof media intents choose `s3-compatible` in production mode. Verified upload bytes now go through signed S3 PUT, the metadata ledger records the provider, and protected file reads use signed S3 GET with a fresh byte-size/SHA-256 integrity check. Pilot mode continues to use the local vault.
- Evidence added: pilot API smoke still passes real byte upload/readback and all existing checks pass after the storage branch was added. The S3 client now covers both backup and proof media paths.
- Honest boundary: this workspace has no real S3-compatible credentials or bucket, so the remote branch was not executed against a live object store. Malware scanning, quarantine, retention and lifecycle deletion remain external release evidence.

### Step 20 - Production Master Data PostgreSQL Runtime Switch v1

- Official score: remains **65%**. The production database/off-host-restore hard cap is still active because no managed PostgreSQL service has been connected and restored in this workspace.
- Capability added: production business reads for clients, living assets, zones, work orders, proof records, sensor latest-state records and incidents now route through `lib/ops-postgres-master-data-store.mjs`. Pilot mode continues to use the existing SQLite adapter.
- Capability added: production admin validation, explicit JSON import and CRUD upserts for clients, living assets, work orders and sensor readings use the PostgreSQL adapter. The adapter creates relationship constraints and reports orphan checks through `/api/health/ready`, `/api/storage` and `/api/admin/master-data/validate`.
- Safety boundary added: an empty production PostgreSQL database never auto-seeds demo JSON. The explicit import path deletes only the seven master-data tables in dependency order and lets foreign-key constraints reject the operation when modules, devices or other dependent operational records exist; it does not use cascading deletion.
- Evidence added: full `npm.cmd run check` passed. It includes syntax validation for the adapter, the 27-table SQLite-to-PostgreSQL migration dry-run, API/device/AI scale/UI smoke tests, and a PostgreSQL master-data smoke test that skips only when no database URL is configured.
- Honest boundary: the production application is not fully PostgreSQL-backed yet. Modules, devices, telemetry history, alerts, AI diagnoses, mobile captures, proof metadata and pilot sessions still use SQLite/local paths unless their own production adapters are added. No live PostgreSQL relationship/count verification, off-host restore drill or real multi-client operating cycle has been evidenced here.
- Target effect: architecture scaffold moves from roughly 82% toward **83%**; official production operations readiness remains **65%**.

### Current Honest Score After Step 20

- Production operations readiness: **65%**.
- Architecture scaffold readiness: approximately **83%**, not the official score.
- Investor-demo readiness: separate and higher; it must not be used as evidence of 1,000+ module production operations.

### Step 21 - Production Module, Device and Telemetry PostgreSQL Runtime Switch v1

- Official score: remains **65%**. The managed database/off-host restore hard cap still requires a real connected service, migration verification and an isolated restore drill.
- Capability added: production module reads/upserts and module storage health now use `asset_modules` in PostgreSQL; pilot mode continues to use SQLite.
- Capability added: production device registry, device-key lookup, signed-request replay ledger, device registration/update, ingestion logs, camera capture metadata and camera object readback now use PostgreSQL. Camera bytes in production are written to and read from the configured S3-compatible bucket with an SHA-256/byte-size ledger check; local camera files remain pilot-only.
- Capability added: production append-only sensor history, latest module readings, batched ingestion, sensor stability snapshots and telemetry storage health now use PostgreSQL. Server routes select the adapter from `DR_FOREST_ENV`, so production business paths no longer call the SQLite module/device/telemetry functions.
- Evidence added: `npm.cmd run check` passed syntax checks, data-model validation, fail-closed production gate, migration dry-run, API/device/AI scale/UI smoke tests and the new PostgreSQL adapter health smoke. The PostgreSQL smoke deliberately skipped because this workspace has no `DR_FOREST_DATABASE_URL`; that is an unfulfilled external dependency, not a pass claim.
- Honest boundary: alert rules/instances, AI diagnosis records, mobile capture records, reminder actions, proof metadata and pilot sessions still use SQLite/local paths. The S3 camera branch and all PostgreSQL CRUD paths have not been executed against a live managed service here. Real module/device/camera IDs, signed gateway traffic, calibration, alert ownership and repeated client operations are still required.
- Target effect: architecture scaffold moves from roughly 83% toward **85%**; official production operations readiness remains **65%**.

### Current Honest Score After Step 21

- Production operations readiness: **65%**.
- Architecture scaffold readiness: approximately **85%**, not the official score.
- Investor-demo readiness: separate and higher; it must not be used as evidence of 1,000+ module production operations.

### Step 22 - Production Alert and AI Vision PostgreSQL Runtime Switch v1

- Official score: remains **65%**. The hard cap is still controlled by live managed-service and field evidence, not by adding another adapter.
- Capability added: production alert-rule CRUD, threshold evaluation, open-alert merging, acknowledgement/resolution state changes and alert storage health now use PostgreSQL. The device and authenticated telemetry ingestion paths evaluate alerts through the same production adapter.
- Capability added: production AI visual-diagnosis task creation, scoped list, provider callback/status update and AI storage health now use PostgreSQL. The task lifecycle remains evidence-only: queued/running/completed/failed are stored, but no unexecuted model result is presented as a diagnosis.
- Evidence added: `npm.cmd run check` passed syntax checks, data-model validation, production-gate checks, all adapter smoke checks, API/device/alert/AI scale tests, 1,000-reading ingestion, generic smoke and Ops UI smoke. The PostgreSQL alert/AI smoke correctly skipped because `DR_FOREST_DATABASE_URL` is not configured in this workspace.
- Honest boundary: mobile capture records, reminder actions, proof metadata, sessions and some operational tables still use SQLite/local paths. No live PostgreSQL query, S3 camera readback or external AI provider evaluation was executed here. Production thresholds still require horticultural calibration and ownership/SLA policy.
- Target effect: architecture scaffold moves from roughly 85% toward **87%**; official production operations readiness remains **65%**.

### Current Honest Score After Step 22

- Production operations readiness: **65%**.
- Architecture scaffold readiness: approximately **87%**, not the official score.
- Investor-demo readiness: separate and higher; it must not be used as evidence of 1,000+ module production operations.

### Step 23 - Production Mobile Capture, Proof Metadata and Reminder PostgreSQL Runtime Switch v1

- Official score: remains **65%**. No external production evidence was added; the managed database, off-host restore, OIDC tenant, S3 bucket and real operating cycles are still not connected in this workspace.
- Capability added: production technician mobile capture batches/items, duplicate batch handling and mobile storage health now use PostgreSQL. The existing permission and client/wall/work-order/module scope checks remain in the server layer.
- Capability added: production proof media metadata, links, upload registration, storage-provider marker, verification status and proof storage health now use PostgreSQL. The existing server path continues to hash bytes and use S3-compatible storage in production; pilot bytes remain in the local vault.
- Capability added: production reminder actions and mobile completion state now use PostgreSQL. Mobile route rendering, reminder completion and audit event creation select the same production adapter.
- Deliberate boundary: pilot password accounts/sessions remain SQLite-only because production login is disabled and replaced by OIDC/JWKS validation. This is not a production persistence gap.
- Evidence added: `npm.cmd run check` passed all syntax, data-model, production-gate, adapter, migration, API, device, alert/AI scale, mobile/proof, generic and UI smoke tests. PostgreSQL adapter smoke tests skipped only because no `DR_FOREST_DATABASE_URL` is configured.
- Honest boundary: no live PostgreSQL count/relationship verification, S3 proof upload/readback, OIDC login, external AI provider evaluation, malware scan, restore drill or real multi-client service cycle was executed here.
- Target effect: architecture scaffold moves from roughly 87% toward **90%**; official production operations readiness remains **65%**.

### Current Honest Score After Step 23

- Production operations readiness: **65%**.
- Architecture scaffold readiness: approximately **90%**, not the official score.
- Investor-demo readiness: separate and higher; it must not be used as evidence of 1,000+ module production operations.

### Step 24 - Production Evidence Report and Score Boundary v1

- Official score: remains **65%**. This step adds evidence discipline, not live production evidence.
- Capability added: `scripts/production-evidence-report.mjs` calls `/api/health`, `/api/health/ready` and an authorized `/api/storage` endpoint, then reports observed mode, backend coverage, evidence-marker status and external-artifact gaps.
- Capability added: the report distinguishes `verified`, `marked-verified-but-not-observed`, `observed-config-only`, `configured-but-not-proven`, `missing` and `pilot-only`. A count of rows, devices or diagnosis tasks is not treated as a field-operation proof.
- Safety boundary added: the report hard-codes the current official score boundary at **65%** and cannot promote it. Only dated PostgreSQL migration, restore, OIDC/MFA, signed-device, media, AI, monitoring and multi-client artifacts reviewed under the release record can change the score.
- Evidence added: `scripts/production-evidence-smoke-test.mjs` proves pilot/production classification, backend observation and the no-auto-promotion rule without pretending to contact a live service. The full `npm.cmd run check` command now runs it.
- Honest boundary: the workspace still has no managed PostgreSQL URL, real S3 bucket, OIDC tenant, field device fleet, external AI evaluation, monitoring delivery record, restore drill or repeated multi-client service evidence. The report will correctly show those as missing or not proven.
- Target effect: architecture scaffold moves from roughly **90% toward 92%**; official production operations readiness remains **65%**.

### Current Honest Score After Step 24

- Production operations readiness: **65%**.
- Architecture scaffold readiness: approximately **92%**, not the official score.
- Investor-demo readiness: separate and higher; it must not be used as evidence of 1,000+ module production operations.

### Step 25 - SQLite to PostgreSQL Migration Verification v1

- Official score: remains **65%**. A verifier is not a live database, backup or restore drill.
- Capability added: `scripts/verify-postgres-migration.mjs` compares the approved SQLite snapshot with the PostgreSQL destination by table set, ordered columns, row counts, foreign-key coverage, orphan relations and the source SHA-256 recorded by the migrator.
- Failure behavior added: when `DR_FOREST_DATABASE_URL` is absent the command reports `skipped` explicitly. When a database is configured, any discrepancy sets a non-zero exit code; it cannot be treated as a warning-only check.
- Evidence added: `scripts/postgres-migration-verification-smoke-test.mjs` covers pass/fail summary behavior. The full `npm.cmd run check` command runs the smoke and the live verifier; the live verifier will skip only because this workspace has no database URL.
- Honest boundary: this workspace still has no destination PostgreSQL instance, so no live row-count/FK/hash comparison has been claimed. The actual migration, staged acceptance dataset and isolated restore drill remain required.
- Target effect: architecture scaffold moves from roughly **92% toward 94%**; official production operations readiness remains **65%**.

### Current Honest Score After Step 25

- Production operations readiness: **65%**.
- Architecture scaffold readiness: approximately **94%**, not the official score.
- Investor-demo readiness: separate and higher; it must not be used as evidence of 1,000+ module production operations.

### Step 26 - Structured Observability and Protected Metrics v1

- Official score: remains **65%**. Application metrics and JSON logs do not prove that a hosted monitoring stack, alert route or on-call recovery process is working.
- Capability added: `lib/ops-observability.mjs` records low-cardinality HTTP request totals, status counts, latency p50/p95, 5xx counts, application error codes and operational event counts with bounded memory limits.
- Capability added: every request keeps the existing `X-Request-ID` correlation and structured JSON log, now including duration and a bounded user-agent field. Query strings and authorization headers are not logged.
- Capability added: protected `GET /api/metrics` is available to Platform Admin and FM Lead only. Client Viewer and field roles do not receive platform-level metrics.
- Evidence added: API smoke confirms metrics access control and schema; `npm.cmd run check` includes syntax validation and the full API smoke. The production runbook now defines the hosting log-sink, alert-routing and escalation artifacts required to convert this scaffold into monitoring evidence.
- Honest boundary: this workspace has no connected log sink, alert webhook, on-call route or recovery notification record. `DR_FOREST_MONITORING_VERIFIED` remains pending and the production score remains capped.
- Target effect: architecture scaffold moves from roughly **94% toward 96%**; official production operations readiness remains **65%**.

### Current Honest Score After Step 26

- Production operations readiness: **65%**.
- Architecture scaffold readiness: approximately **96%**, not the official score.
- Investor-demo readiness: separate and higher; it must not be used as evidence of 1,000+ module production operations.

### Step 27 - Durable Alert Notification Outbox and Retry Worker v1

- Official score: remains **65%**. The outbox and worker are application scaffolding; no real webhook receiver, escalation route or recovery notification has been verified.
- Capability added: every new `telemetry.alert.opened` event creates an idempotent `NTF-ALERT-<alertId>` task in `ops_notification_outbox`. SQLite and PostgreSQL adapters expose the same pending/processing/retry/delivered/failed lifecycle and health counts.
- Capability added: `scripts/process-notification-outbox.mjs` claims due tasks with a lease, signs JSON payloads with `DR_FOREST_ALERT_WEBHOOK_SECRET`, marks successes, and applies bounded exponential backoff. Repeated runs are safe because notification IDs are idempotent.
- Safety boundary added: production configuration now requires an HTTPS `DR_FOREST_ALERT_WEBHOOK_URL` and a 32-byte-or-longer `DR_FOREST_ALERT_WEBHOOK_SECRET`; production cannot report ready with the notification channel absent.
- Capability added: protected `/api/notifications` inspection and `/api/health/ready`/`/api/storage` notification counts make stuck, failed and due tasks visible to FM Lead/Platform Admin.
- Evidence added: `scripts/notification-outbox-smoke-test.mjs` proves duplicate suppression, claim attempts, retry state, backoff and delivery state. The worker correctly reports `skipped` when no webhook is configured. Full `npm.cmd run check` still must pass before this step is recorded complete.
- Honest boundary: there is no connected notification webhook, secret-manager value, receiver acknowledgement, on-call escalation, push channel, WhatsApp/Teams connector or recovery incident in this workspace. `DR_FOREST_MONITORING_VERIFIED` remains pending.
- Target effect: architecture scaffold moves from roughly **96% toward 98%**; official production operations readiness remains **65%**.

### Current Honest Score After Step 27

- Production operations readiness: **65%**.
- Architecture scaffold readiness: approximately **98%**, not the official score.
- Investor-demo readiness: separate and higher; it must not be used as evidence of 1,000+ module production operations.

### Step 28 - Graceful Shutdown and Drain Readiness v1

- Official score: remains **65%**. Lifecycle behavior is application evidence, not proof of a live deployment controller, service restart or field data recovery.
- Capability added: `SIGTERM`/`SIGINT` set a server drain state. During drain, readiness returns HTTP 503 with `SERVICE_DRAINING`, while liveness remains available for process supervision.
- Capability added: new business/static requests are rejected during drain, in-flight requests are allowed to finish, and PostgreSQL pools are closed before the process exits. `DR_FOREST_SHUTDOWN_TIMEOUT_MS` defaults to 15 seconds.
- Evidence added: `scripts/server-lifecycle-smoke-test.mjs` starts an isolated server, verifies readiness and request correlation, sends the Windows-safe IPC shutdown command, and confirms structured shutdown start/complete events and exit code 0. Production signal handlers remain `SIGTERM`/`SIGINT`.
- Honest boundary: no container orchestrator rollout, real PostgreSQL pool shutdown, multi-instance traffic drain, device reconnect test or lost-request recovery drill was executed here. Those remain deployment acceptance evidence.
- Target effect: architecture scaffold moves from roughly **98% toward 99%**; official production operations readiness remains **65%**.

### Current Honest Score After Step 28

- Production operations readiness: **65%**.
- Architecture scaffold readiness: approximately **99%**, not the official score.
- Investor-demo readiness: separate and higher; it must not be used as evidence of 1,000+ module production operations.

### Step 29 - Consistent Backup Snapshot and Restore Integrity v2

- Official score: remains **65%**. A local SQLite snapshot and isolated verification do not prove a managed PostgreSQL backup, off-host retention or a real restore drill.
- Capability added: `scripts/backup-runtime.mjs` now creates the SQLite backup through `VACUUM INTO`, after an integrity check, instead of copying only the main database file. The manifest records `consistency.method` and `sourceIntegrity`.
- Capability added: `scripts/restore-runtime.mjs` validates the staged database with `PRAGMA integrity_check` before either verify-only exit or replacement. A corrupt or incomplete database now fails the restore path before it can be installed.
- Evidence added: `npm.cmd run backup:smoke` runs backup and restore verification in an isolated temporary runtime, checks the v2 manifest, checksums and both source/staged database integrity, then removes its temporary files.
- Honest boundary: no managed PostgreSQL backup, off-host object-storage upload, encryption-key custody, retention policy, point-in-time recovery or production restore drill was executed here. The production hard cap therefore does not move.
- Target effect: architecture scaffold remains approximately **99%**; official production operations readiness remains **65%**.

### Current Honest Score After Step 29

- Production operations readiness: **65%**.
- Architecture scaffold readiness: approximately **99%**, not the official score.
- Investor-demo readiness: separate and higher; it must not be used as evidence of 1,000+ module production operations.

### Step 30 - Technician Offline Queue Reliability v3

- Official score: remains **65%**. This is a PWA workflow hardening step; it does not prove a managed mobile fleet, real field connectivity or multi-device conflict testing.
- Capability added: offline capture records now retain queue status, retry count, last attempt time and the last sync error. Failed records remain visible and can be retried manually or when the browser returns online.
- Reliability fix: queued records store their reminder action and module telemetry snapshot. Queue replay no longer depends on the currently selected page state after the technician reopens the app or switches work orders.
- Idempotency fix: proof media IDs are deterministic per capture batch, so a partial sync can safely retry the batch, media intent and upload without generating a new evidence object each time.
- Security/reliability fix: the Service Worker caches only static files, excludes API responses and ignores non-GET requests. This avoids stale tenant-scoped API data and accidental POST caching.
- Evidence added: the UI smoke clicks `Save offline`, verifies one pending queue record and visible queue status; the full `npm.cmd run check` passed. No real handset, network interruption, camera permission or two-device conflict test was claimed.
- Target effect: architecture scaffold remains approximately **99%**; official production operations readiness remains **65%**.

### Current Honest Score After Step 30

- Production operations readiness: **65%**.
- Architecture scaffold readiness: approximately **99%**, not the official score.
- Investor-demo readiness: separate and higher; it must not be used as evidence of 1,000+ module production operations.

### Step 31 - Device Ingress Guardrails v2

- Official score: remains **65%**. Request guards and local rate limits do not prove that real gateways can sustain the configured sampling plan or that a production WAF is deployed.
- Capability added: JSON device requests now enforce `Content-Type: application/json`, reject oversized declared bodies before reading them, and return an explicit `REQUEST_BODY_TOO_LARGE` code for streamed overflow.
- Capability added: reading batches have a configurable default maximum of 100 records. Sensor/camera devices and gateways have separate per-minute rate budgets, in addition to the source-IP budget, so one gateway can be tuned without weakening the whole endpoint.
- Reliability/security fix: the in-process rate limiter removes expired buckets and caps active keys at 5,000 to avoid unbounded memory growth from changing client IPs.
- Evidence added: device ingestion smoke verifies non-JSON rejection, 101-record batch rejection, normal reading acceptance, duplicate idempotency and camera readback; full `npm.cmd run check` remains the release verification command.
- Honest boundary: no production gateway load test, rate-limit tuning against real sampling frequency, WAF/API gateway, network allowlist or multi-instance shared rate limiter was executed here.
- Target effect: architecture scaffold remains approximately **99%**; official production operations readiness remains **65%**.

### Current Honest Score After Step 31

- Production operations readiness: **65%**.
- Architecture scaffold readiness: approximately **99%**, not the official score.
- Investor-demo readiness: separate and higher; it must not be used as evidence of 1,000+ module production operations.

### Step 32 - Client Read-only Evidence Portal and ESG Auditor View v1

- Official score remains **65%**. A local browser smoke test is not evidence of real client users, external auditor sign-off or production report delivery.
- Capability added: `portal.html`, `portal.js` and `portal.css` provide a scoped client read-only view for portfolio health, assets, proof vault evidence and active exceptions. It has no write controls.
- Capability added: auditor mode uses the existing `esg-auditor` permission to expose data quality status, relationship coverage and production gaps. Client mode cannot see the auditor panel and remains client-scoped.
- Evidence added: the UI smoke loads both roles, confirms the client view returns one scoped asset, confirms the auditor panel is hidden from the client and visible to the auditor, and the full `npm.cmd run check` passes.
- Honest boundary: the role query is a pilot demo selector only. Production must use OIDC claims, server-side role checks and client scope; no production OIDC account, external auditor workflow, downloadable signed report or managed media store was tested.
- Target effect: architecture scaffold remains approximately **99%**; official production operations readiness remains **65%**.

### Current Honest Score After Step 32

- Production operations readiness: **65%**.
- Architecture scaffold readiness: approximately **99%**, not the official score.
- Investor-demo readiness: separate and higher; it must not be used as evidence of 1,000+ module production operations.

### Step 33 - Scoped Evidence Package Export v1

- Official score remains **65%**. A browser-generated JSON snapshot is not a signed ESG report, external audit acceptance or proof of a managed delivery channel.
- Capability added: client and auditor portal users can download a read-only `dr-forest-evidence-<role>-<timestamp>.json` package after the scoped API reads complete.
- Scope boundary: the package contains only the current server-filtered portfolio, assets, proof media objects, active telemetry exceptions and active AI diagnoses. Auditor mode additionally includes the data-quality response; client mode never receives that panel or payload.
- Evidence added: UI smoke confirms both role-specific download buttons enable after loading and produce role-scoped filenames; full `npm.cmd run check` passes.
- Honest boundary: the export is generated in-browser and is not cryptographically signed. Production still needs a server-side report ID, immutable evidence snapshot, signed download URL, retention policy and delivery/acknowledgement record.
- Target effect: architecture scaffold remains approximately **99%**; official production operations readiness remains **65%**.

### Current Honest Score After Step 33

- Production operations readiness: **65%**.
- Architecture scaffold readiness: approximately **99%**, not the official score.
- Investor-demo readiness: separate and higher; it must not be used as evidence of 1,000+ module production operations.

### Step 34 - Server-generated Fingerprinted Evidence Snapshot v1

- Official score remains **65%**. Server-side assembly and hashing improve traceability but do not prove immutable storage, signed reporting or external audit acceptance.
- Capability added: `GET /api/proof/evidence-snapshot` assembles the current scoped portfolio, assets, proof media metadata, active telemetry exceptions and active AI diagnoses on the server, then returns a `snapshotId`, canonical SHA-256 fingerprint and JSON package.
- Scope boundary: client viewers receive only their server-filtered asset and evidence set. Data-quality content is included only when the principal already has `data.quality.read`, so the client viewer cannot receive the auditor panel through export.
- UI behavior updated: the portal downloads the server response and shows the returned SHA-256 fingerprint instead of hashing a browser-built copy.
- Evidence added: API smoke verifies client scope, 64-character SHA-256, client exclusion of `dataQuality`, and auditor inclusion of the quality report; UI smoke verifies both role-specific downloads; full `npm.cmd run check` passes.
- Honest boundary: the snapshot is recomputed per request and is not yet persisted as an immutable report object, digitally signed, retained, delivered through a managed channel or acknowledged by an external auditor.
- Target effect: architecture scaffold remains approximately **99%**; official production operations readiness remains **65%**.

### Current Honest Score After Step 34

- Production operations readiness: **65%**.
- Architecture scaffold readiness: approximately **99%**, not the official score.
- Investor-demo readiness: separate and higher; it must not be used as evidence of 1,000+ module production operations.

### Step 35 - Persisted Evidence Snapshot Registry v1

- Official score remains **65%**. Local SQLite persistence and a production PostgreSQL adapter are application evidence; no managed database deployment, backup retention or real auditor delivery was executed.
- Capability added: FM Lead/Platform Admin can persist the current server-generated evidence package into an append-only `evidence_snapshots` registry. The record stores scope, viewer role, canonical package JSON, generated/persisted timestamps and SHA-256.
- Capability added: the same contract exists for PostgreSQL with `infra/postgres/002_evidence_snapshots.sql`; the adapter verifies the package hash before insert and returns duplicate records without updating them.
- Permission boundary added: client viewers and ESG auditors can read only snapshots within their recorded client scope; only FM Lead/Platform Admin can create persisted snapshots. The client UI remains read-only.
- Evidence added: API smoke verifies permission denial, SQLite insert, read-back hash equality, all-portfolio scope denial and storage health count; `check:evidence` and full `npm.cmd run check` must both pass before release.
- Honest boundary: there is no snapshot signing key, immutable object-store copy, retention/expiry worker, report delivery receipt, backup restore test for this new table or managed PostgreSQL run in this workspace.
- Target effect: architecture scaffold remains approximately **99%**; official production operations readiness remains **65%**.

### Current Honest Score After Step 35

- Production operations readiness: **65%**.
- Architecture scaffold readiness: approximately **99%**, not the official score.
- Investor-demo readiness: separate and higher; it must not be used as evidence of 1,000+ module production operations.

### Step 36 - Evidence Snapshot HMAC Signature Contract v1

- Official score remains **65%**. A local secret-driven smoke test proves the application contract, not production key custody, rotation, external verification or auditor acceptance.
- Capability added: server-generated evidence snapshots now return an explicit `signatureAlgorithm: hmac-sha256`, `signatureStatus`, `signatureKeyId` and `signature` contract. The HMAC input is the stable string `${snapshotId}.${sha256}`; the signing secret is never returned in the package.
- Pilot behavior is explicit: when `DR_FOREST_EVIDENCE_SIGNING_SECRET` is absent, the API returns `signatureStatus: unsigned`, `signature: null` and no key ID. This prevents a SHA-256 fingerprint from being confused with a signed report.
- Production gate added: `DR_FOREST_EVIDENCE_SIGNING_SECRET` is required in production and must contain at least 32 bytes. `.env.production.example` also documents the key ID used for rotation and verification mapping.
- Persistence added: SQLite and PostgreSQL evidence snapshot stores persist signature algorithm, status, key ID and signature. Migration v2 is backward-compatible with the existing pilot v1 table through additive columns.
- Evidence added: `npm.cmd run check:evidence` runs syntax checks plus an isolated signed-server smoke that independently recalculates the HMAC; API smoke verifies the unsigned pilot boundary; production-gate smoke verifies missing signing configuration fails closed.
- Honest boundary: no managed secret manager, key rotation, independent external verifier, immutable object-store retention, signed delivery receipt or production PostgreSQL execution exists in this workspace yet.
- Target effect: architecture scaffold remains approximately **99%**; official production operations readiness remains **65%**.

### Current Honest Score After Step 36

- Production operations readiness: **65%**.
- Architecture scaffold readiness: approximately **99%**, not the official score.
- Investor-demo readiness: separate and higher; it must not be used as evidence of 1,000+ module production operations.
