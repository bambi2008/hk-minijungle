# DR FOREST OPS Production Deployment Runbook

This runbook is the boundary between the pilot server and real Hong Kong FM operations. A green local smoke test is not a production sign-off.

For the Tencent Cloud Hong Kong path, use `docs/tencent-cloud-production-cutover.md`. It defines the TencentDB/COS endpoint shape, virtual-hosted COS addressing, production container and off-host restore commands.

## Required external resources

1. Managed PostgreSQL with TLS, point-in-time recovery, daily snapshots and a restricted application role.
2. S3-compatible object storage for proof/camera media and a separate bucket or account for encrypted backups. Tencent COS should use `DR_FOREST_OBJECT_STORAGE_STYLE=virtual` with the Hong Kong COS endpoint.
3. Enterprise OIDC tenant with MFA, groups/roles and client-scope claims. The token must contain a role and, for scoped users, `client_ids`.
4. A private deployment endpoint with HTTPS, secret manager, log retention, alert routing and health monitoring. `DR_FOREST_DEVICE_SIGNING_SECRET` is a server-side pepper for stored device-key hashes; it is never sent to devices.
5. Real device/gateway inventory: module IDs, device IDs, calibrated metric units, key rotation owner and network egress policy.

## Deployment order

0. Run `npm.cmd run production:preflight -- --url https://ops.example.com --bearer-token <short-lived-token>` from the deployment runner. It must report `status: ready`; `blocked` or `unverified` is a release stop. The preflight is read-only: it does not migrate, seed, or repair the database.
1. Run `node scripts/migrate-sqlite-to-postgres.mjs --dry-run` against the approved source snapshot and review the complete discovered table inventory; do not rely on an old fixed table count.
2. Apply `node scripts/migrate-sqlite-to-postgres.mjs` against a staging PostgreSQL database. The migrator derives the current master-data/device/telemetry/alert/AI/session schema and records a source hash in `ops_migration_runs`.
3. Run `node scripts/verify-postgres-migration.mjs` against the same approved source snapshot and destination database. It must report matching table names, ordered columns, row counts, foreign-key coverage, zero orphan relations and a matching source hash.
4. Verify that the production server's client/asset/work-order/proof/sensor/incident reads are using `postgres-master-data`, then import only an approved tenancy dataset and run relationship validation. An empty production database does not auto-seed demo JSON; do not use demo seed data as live tenancy data.
5. Keep the explicit master-data import behind the admin permission and run it only before dependent modules/devices are registered. Foreign-key constraints intentionally reject an import that would delete referenced operational records.
6. Create the S3 buckets with private access, lifecycle rules, server-side encryption and a malware-scanning/quarantine path. Production proof upload/readback uses the signed S3 PUT/GET path; pilot local-vault files must not be treated as production evidence. The app records the scanner callback in `proof_media_scan_results`; a production file download is blocked until its latest result is `clean` and its SHA-256 matches the media ledger.
7. Provision the environment variables from `.env.production.example` through a secret manager. Never put credentials in the repository or browser bundle.
8. Start one staging instance with `DR_FOREST_ENV=production`. `/api/health/ready` must be HTTP 200 and list PostgreSQL/S3/OIDC as active backends.
9. Confirm `/api/health/ready` and `/api/storage` report PostgreSQL for master data, modules, devices, telemetry, alerts, AI diagnosis tasks, mobile capture, proof metadata and reminders. Confirm pilot password sessions are disabled and OIDC is active; any remaining SQLite tables must be explicitly accepted in the release record.
10. Run an encrypted PostgreSQL backup, upload it off-host, then perform `npm.cmd run restore:postgres -- --from-offhost --verify-only` and one isolated restore drill. `npm.cmd run backup:runtime` is monitored and selects the PostgreSQL backup script automatically in production; it also adds `--upload` when needed. The production image includes `pg_dump` and `pg_restore`; the SQLite pilot backup uses `VACUUM INTO` for a consistent snapshot and the restore verifier runs `PRAGMA integrity_check`; neither local check substitutes for a managed PostgreSQL restore drill.
11. Register a real gateway and camera, send signed readings/captures, verify S3 camera readback, alerts, evidence hashes and client-scope access using a real OIDC user.
12. Run two repeated service cycles across at least two client accounts. Record sync success, alert response, proof verification, backup recovery and operator time.
13. Promote only after operations, security and the FM partner sign the acceptance record.

## Observability check

The service exposes a protected `GET /api/metrics` endpoint for FM Lead and Platform Admin roles. It reports low-cardinality request counts, 5xx counts, application error codes, latency percentiles, operational event counts and whether the monitoring evidence marker is present.

```powershell
$env:DR_FOREST_EVIDENCE_BEARER_TOKEN = "<short-lived-oidc-token>"
Invoke-WebRequest -UseBasicParsing -Headers @{ Authorization = "Bearer $env:DR_FOREST_EVIDENCE_BEARER_TOKEN" } https://ops.example.com/api/metrics
```

The endpoint and JSON stdout logs are an application contract. They do not prove that the hosting log sink, alert route, on-call escalation or recovery notification is working. Attach those platform-level delivery and incident artifacts to the production evidence record.

## Alert and field-exception notification worker

Alert-open events and technician capture batches containing exception items create idempotent `ops_notification_outbox` records. The FM Operations page exposes due, retry and failed delivery counts, but the page does not deliver or silently acknowledge notifications. Run the worker from a scheduler or a long-running job with the production webhook secret:

```powershell
npm.cmd run notifications:once
```

The worker first acquires the database lease `notification-outbox-delivery`, then claims due tasks, signs the JSON payload with `DR_FOREST_ALERT_WEBHOOK_SECRET`, marks successful deliveries, and applies exponential backoff until `DR_FOREST_NOTIFICATION_MAX_ATTEMPTS`. `DR_FOREST_NOTIFICATION_WORKER_LEASE_SECONDS` defaults to 300 seconds. A second worker exits as `skipped` while the lease is held. A missing webhook intentionally leaves tasks pending and returns `skipped`; neither state is a delivery pass. Production should monitor the worker lease, failed/retry counts and scheduler heartbeat, and retain delivery responses for the release record.

Remediation deadlines use `DR_FOREST_REMEDIATION_ESCALATION_HOURS`, a strictly increasing three-value list that defaults to `0,4,24`. Run `POST /api/remediation/sla-scan` from an authenticated scheduler before the notification worker. The scan owns the database lease `remediation-sla-scan`, pages through active tasks, persists only a higher escalation level and creates one outbox record per task and level; an overlapping run receives HTTP 409. Rerunning after release is idempotent until a deadline changes or the next threshold is reached. Changing `due_at` resets the persisted escalation state so a rescheduled task can be measured against its new commitment. The default values are pilot controls, not agreed FM response times; approve them per client contract.

## Device ingress limits

Device telemetry and camera ports require `Content-Type: application/json`. JSON bodies are rejected with HTTP 415 when the content type is wrong and HTTP 413 when the declared or streamed body exceeds the route limit. Reading batches default to 100 records. The default per-minute limits are 1,200 requests per source IP, 300 per sensor/camera device and 1,200 per gateway; tune them from the real gateway sampling plan through the corresponding `DR_FOREST_DEVICE_*` environment variables rather than silently increasing them.

The service also bounds the in-process rate-limit bucket map to 5,000 active keys and removes expired buckets. This protects a single pilot instance from unbounded client-IP cardinality. A production deployment still needs an upstream WAF/API gateway, device-network policy and load testing with the actual gateway topology.

## Client and auditor views

`portal.html?role=client` is a pilot-only read-only client view. It displays only the authenticated principal's client-scoped portfolio, assets, proof evidence and open exceptions. `portal.html?role=auditor` additionally displays the data-quality and ESG evidence-gap panel for a principal with the `esg-auditor` permission. The query parameter is not an authentication mechanism: production must remove the demo selector and use OIDC claims, server-side role checks and database row policies. Neither view has write operations.

`GET /api/ops/timeline` is the internal operations audit projection. It is protected by `ops.events.read`, returns newest-first event records with bounded `limit`, optional `types`, `entityType`, `clientId`, `before` and `beforeId` filters, and returns a cursor when more records are available. SQLite and PostgreSQL now apply those filters and the candidate limit in the database before the server resolves entity ownership and principal scope, so the request does not load the full event history. A client-scope filter is still checked before query construction and the entity resolver remains the final ownership boundary. The `total` and `hasMore` values are projection metadata over the bounded candidate window; production must add reviewed indexes, retention policy and exact-count requirements before treating them as warehouse-grade reporting.

`GET /api/ops/quality` is an internal FM Lead/Platform Admin readiness panel. It is protected by `storage.read` and is intentionally unavailable to client viewers and auditors because it contains platform-wide operational gaps. The response reports four independent gates: complete temperature/humidity/CO2/MC telemetry per module, connected camera endpoints, a three-part service-evidence chain (field batches, verified media and persisted snapshots), and active exception counts. `ready`, `partial`, `blocked` and `attention` are current observations only; they are not a production certification, ESG assurance statement or replacement for incident review.

The quality response also applies freshness and review windows. `DR_FOREST_TELEMETRY_STALE_MINUTES` defaults to `180`, and a module is fresh only when all four required metrics have observations inside that window. `DR_FOREST_CAMERA_STALE_MINUTES` defaults to `1440`, and a camera is fresh only when a registered camera device is active and has a recent `lastSeenAt`; a generated module camera map is not enough. `DR_FOREST_EXCEPTION_SLA_HOURS` defaults to `24`; open alert or pending AI records older than this are labelled `overdue`. These are pilot defaults, not universal FM SLAs: production must approve them per contract, monitor clock skew and retain the change record.

The same response returns a bounded `moduleReadiness` action queue with at most 20 unready modules. It is ordered by incomplete telemetry, stale telemetry, missing camera registration and stale camera heartbeat. The queue is an operator aid, not a complete export; production reporting must use a dedicated paginated module query and retain the selected remediation owner, due time and resolution evidence.

The module queue can create and update internal remediation tasks. `POST /api/remediation/tasks` accepts a scoped `moduleId`, `sourceKey`, `reasons`, `priority`, optional `assignedTo` and optional `dueAt`; repeated active creation for the same module/source is idempotent. `GET /api/remediation/tasks` provides database-backed status, owner, priority, review and deadline filters with an opaque cursor and an exact scoped dispatch summary. FM Lead/Platform Admin may update 1-100 validated task IDs through `POST /api/remediation/tasks/bulk`; every request must include an `Idempotency-Key` header and `expectedUpdatedAtById` values from the loaded page. Exact request replay returns the first persisted response, key reuse with different data is rejected, and stale versions return conflict instead of silently overwriting another operator. Client viewers and field technicians cannot use bulk dispatch. The assigned technician starts work through mobile, which records `accepted_by` and `accepted_at`, then submits completion evidence with `submitForReview: true`. This leaves the task active with `review_status = pending`. Only FM Lead or Platform Admin can approve or reject it.

This workflow is a control-plane record, not a service certificate. Production must connect its actor IDs to OIDC principals and validate the process through repeated live field cycles. SQLite reports remediation migration `2026-08-28.remediation-dispatch-sla-v1`, operations-control migration `2026-08-29.ops-control-import-v1` and workforce migration `2026-08-30.workforce-dispatch-v1`; PostgreSQL deployments must apply `infra/postgres/003_remediation_tasks.sql` through `008_workforce_dispatch.sql`, then pass preflight migration/table checks.

## Workforce dispatch

Technician assignment is no longer an unchecked text field. `ops_technicians` stores stable principal ID, active state, skills, districts, shift and daily-minute capacity. `ops_workforce_assignments` stores the target, service date/start, estimate, required skills, district, status and assigning actor. The server rejects inactive, unknown, out-of-district, unskilled, over-capacity, outside-shift and overlapping assignments before dispatch.

Ops Today requests shared candidates for the selected remediation tasks and displays remaining capacity in the assignment dropdown. The technician mobile route reads active work-order assignments and then applies the existing principal client scope. Completing a visit or moving a remediation task through acceptance/review updates the capacity ledger. See `docs/workforce-dispatch.md` for the operator path and API contract.

The current control is not route optimisation. Production still needs OIDC-to-technician provisioning, approved shift/absence inputs, Hong Kong travel-time modelling, concurrency/load evidence and measured field acceptance. Remediation updates and workforce reservations are coordinated by application logic rather than one all-task transaction, so partial bulk failure remains an explicit runbook/reconciliation risk.

## Inventory lots and stock counts

Apply `010_inventory_route_kits.sql` and `014_inventory_traceability.sql`. Live PostgreSQL must start without pilot stock. Record approved physical opening quantities as real supplier lots or retain the balance as explicitly untracked stock until reconciled.

Lot receipts require supplier, supplier lot code, received date and expiry. Route-kit transfer and field consumption allocate FEFO lots inside the same inventory transaction. A technician can submit a count only for their own route kit; submission does not change stock. A different FM Lead or Platform Admin approves or rejects with a note. Approval is blocked when the lot changed after submission or would reduce aggregate stock below reserved quantity. See `docs/inventory-traceability-and-counts.md`.

The workflow is not purchase-order, barcode, cold-chain or financial inventory software. Production acceptance requires a real opening count, repeated receipt/transfer/consume/count cycles and variance review against warehouse evidence.

## Service contracts and SLA

Apply `015_service_contracts.sql` after migration `014`, then apply `016_service_contract_versions_and_sla.sql`. Live PostgreSQL starts with no service contracts. Import only reviewed terms from signed agreements: client, covered living assets, contract dates, service window, evidence requirement, visit frequency, fee and the response/resolution hours for critical, high, normal and low priority. The application creates an initial version snapshot; later amendments and renewals must go through a pending request and authorized FM approval, and each remediation task stores its committed SLA deadline for later attainment reporting.

Create records as `draft`. An FM Lead or Platform Admin activates only after the agreement is effective, and every activation, suspension, resumption or termination requires an audit note and current `updatedAt` version. Client viewers can read only their own contract scope; field technicians receive only the compact plan/window attached to an assigned mobile route.

When a remediation task has no explicit deadline, the server derives `dueAt` from the active contract's resolution SLA. A manually supplied deadline remains authoritative. Missing, scheduled, suspended or expired coverage is recorded in the audit event and does not silently invent an SLA. Run the remediation SLA scanner and notification worker as documented above, then verify at least one real task per priority against the signed terms.

The platform record is an operational control, not the executed legal agreement or proof that service was delivered. Retain the signed source, amendment approval, customer notification and actual field evidence outside these tables according to the approved records policy. SLA attainment is only calculable for tasks linked after this migration; the API reports unlinked tasks explicitly. See `docs/service-contracts-and-sla.md`.

## Airtable maintenance intake

Airtable is supported as a temporary maintenance-record source through a controlled CSV handoff, not as a production runtime dependency. Export one CSV, open `Maintenance history` in Ops Today, download the canonical template, then preview the file before applying it. Required fields are `record_id`, `wall_id` and `service_date`; the supported optional fields are `status`, `priority`, `technician_id`, `tasks`, `notes` and `updated_at`.

Preview validates CSV quoting, required columns, dates, status/priority values, duplicate record IDs, current asset IDs and authenticated client scope. It persists the checksum, normalized rows and row-level errors in `ops_maintenance_imports`. Apply is all-valid-only, owns a batch-specific database lease and writes stable `AIR-*` work-order IDs so a repeat cannot create another work order. The final batch actor/time and one `maintenance.import.applied` event are retained. See `docs/airtable-maintenance-import.md` for the field contract and operating steps.

The maintenance import apply path now uses `2026-08-29.atomic-maintenance-import-v1`: work-order upserts, batch status and the `maintenance.import.applied` audit event are written in one SQLite or PostgreSQL transaction. A retry of an applied batch is idempotent, and a constraint or write failure rolls back the batch status, work orders and audit event together. This closes the previous partial-apply gap for the supported database adapters.

This does not turn Airtable into live two-way synchronization or provide conflict resolution against edits made in both systems. High-volume or unattended production imports still require a live managed PostgreSQL run, connection-pool/load evidence, operator access review and a real restore/recovery drill.

The import also applies a source-freshness guard when Airtable provides `updated_at`: a preview flags an older export against the existing `AIR-*` work order, and the final transaction rechecks the timestamp before writing. Missing source timestamps remain an explicit ordering gap and should be resolved in the Airtable export contract before unattended use.

The technician PWA reads `GET /api/mobile/remediation-tasks?statuses=open,assigned,in_progress` and updates `PATCH /api/mobile/remediation-tasks/:id`. A field technician receives only assigned tasks, records acceptance when starting, and submits a capture batch ID or uploaded media ID as `evidenceRef` for FM review. Pending tasks remain visible but locked; rejected tasks expose the FM note and can be resumed. This remains a pilot control until production identity and repeated real-site review cycles are evidenced.

After the data loads, `Download evidence / 下載證據` creates a role-labelled JSON snapshot in the browser. It is useful for pilot review and partner walkthroughs, but it is not a signed report. A production release must replace or supplement it with an immutable server-side snapshot, a signed download URL, retention controls and a delivery acknowledgement.

The portal now calls `GET /api/proof/evidence-snapshot` when exporting. The server assembles the current scoped package and returns `snapshotId`, `hashAlgorithm: sha256` and a 64-character fingerprint. It also returns `signatureAlgorithm: hmac-sha256`, `signatureStatus`, `signatureKeyId` and `signature`. Without `DR_FOREST_EVIDENCE_SIGNING_SECRET`, pilot responses are explicitly `unsigned` and the signature is `null`; this is intentional and must not be presented as signed ESG evidence.

For internal report preparation, FM Lead/Platform Admin can `POST /api/proof/evidence-snapshots`. The server verifies the canonical package hash before inserting an append-only record in `evidence_snapshots`; `GET /api/proof/evidence-snapshots/:snapshotId` rechecks access against the stored client scope. Client viewers have `proof.snapshot.read` but no `proof.snapshot.write`, and an all-portfolio snapshot is not readable by a client-scoped principal.

The portal also calls `GET /api/proof/evidence-snapshots?limit=5` to display metadata for persisted snapshots visible to the current principal. The list is filtered server-side using the stored `client_ids` scope and deliberately omits the package body; a selected row can be downloaded through the scoped `GET /api/proof/evidence-snapshots/:snapshotId` route. A client viewer therefore receives an empty ledger for an all-portfolio snapshot rather than a hidden-but-downloadable record. This is a read-only pilot review surface, not an external assurance portal.

The pilot uses SQLite migration `2026-08-23.evidence-snapshot-v3`. Production uses the matching PostgreSQL adapter and `infra/postgres/002_evidence_snapshots.sql`. Production must load `DR_FOREST_EVIDENCE_SIGNING_SECRET` from a secret manager, keep the key ID stable during its validity window, define rotation and verification ownership, set `DR_FOREST_EVIDENCE_RETENTION_DAYS` between 30 and 3650, and cover the signed record with retention, off-host backup and delivery acknowledgement controls.

FM Lead/Platform Admin can verify a persisted snapshot with `POST /api/proof/evidence-snapshots/:snapshotId`. The endpoint recalculates the package hash and HMAC, persists the verification result and never upgrades an unsigned pilot snapshot to `verified`. A scheduled `POST /api/proof/evidence-snapshots/retention-sweep` or `npm.cmd run evidence:retention` marks expired standard snapshots as `expired`; it does not delete evidence and does not expire `legal-hold` records.

The FM Lead `operations.html` page now exposes these controls under `ESG snapshot ledger`: `Persist current snapshot`, `Verify latest` and `Run retention sweep`. The panel shows the persisted count, verified count, latest snapshot ID, signature status, verification status, hash prefix and expiry. Pilot mode intentionally displays `unsigned`; a visible persisted record is not a signed ESG certification.

## Backup consistency check

`npm.cmd run backup:runtime` is the monitored entry point. Pilot mode records a `2026-08-23.runtime-backup-v2` manifest with `consistency.method: sqlite-vacuum-into`; production mode is fail-closed for this SQLite script and the wrapper launches `backup-postgres-runtime.mjs`, which records a custom-format `pg_dump`, AES-256-GCM encryption, off-host upload and remote readback. A retention policy is recorded in each manifest from `DR_FOREST_BACKUP_RETENTION_DAYS` and `DR_FOREST_BACKUP_RETENTION_COUNT`.

Use `npm.cmd run backup:retention:plan -- --root .\backups` to inspect local backup directories without deleting anything. It is a dry run by default; `--apply` is an explicit local deletion operation and must only be used after reviewing the printed plan. COS retention is a bucket lifecycle rule and must be configured separately in Tencent Cloud; the application does not claim to have applied that remote rule.

`npm.cmd run backup:smoke` copies the current pilot database into an isolated temporary runtime, creates a backup, verifies checksums and restores the database into staging, then checks SQLite integrity before deleting the temporary files. This proves the local backup contract only. Production still requires a managed PostgreSQL backup, off-host retention, encryption-key custody and a dated restore drill.

## Graceful shutdown and drain

The server treats `SIGTERM` and `SIGINT` as a drain request. It first marks the instance as draining, then:

1. `/api/health/ready` returns HTTP 503 with `status: draining` and `code: SERVICE_DRAINING`.
2. New business and static requests return HTTP 503 with `SERVICE_DRAINING`.
3. Existing in-flight requests are allowed to finish through `server.close()`.
4. PostgreSQL pools are closed before the process exits.

`DR_FOREST_SHUTDOWN_TIMEOUT_MS` controls the maximum drain wait and defaults to 15 seconds. A deployment controller should remove the instance from service after readiness becomes non-ready, send `SIGTERM`, wait for termination and only then replace it. The lifecycle smoke test uses the Node IPC shutdown message on Windows because the local child-process signal implementation bypasses Node's signal handlers; production containers and service managers must use `SIGTERM`/`SIGINT`.

## Production gate evidence

Attach these artifacts to the release:

- `/api/health/ready` response with timestamp and deployment ID.
- PostgreSQL migration list and foreign-key/relationship report.
- S3 upload/readback and a scanner callback with `status: clean` for a real proof image. The callback contract is `PUT /api/proof/media-evidence/:id/scan` with `scanId`, `provider`, `status`, `sha256`, `scannedAt` and `recordedBy`; FM Lead/Platform Admin authorization is required until a dedicated scanner principal is provisioned.
- OIDC login, MFA, role-scope and revoked-session evidence.
- Signed device request, rejected timestamp, rejected nonce replay and rotated-key evidence.
- Encrypted off-host backup manifest, checksum and isolated restore log.
- Two-client repeated service-cycle report with unresolved exceptions and response times.

Until these artifacts exist, report the application as pilot-ready/architecture-ready, not as production-ready for 1,000+ modules.

## Evidence collection command

Use the evidence report after the server is running. It distinguishes configuration, endpoint observation and independently reviewed field evidence.

```powershell
$env:DR_FOREST_EVIDENCE_PRINCIPAL = "fm-lead"
npm.cmd run evidence:production -- --url http://127.0.0.1:8033/ --out .\artifacts\production-evidence.json
```

For production, set a short-lived OIDC bearer token instead of a pilot principal. `--strict` is a release-check helper; it does not change the official score and cannot replace the dated artifacts above.
