# DR FOREST OPS Production Deployment Runbook

This runbook is the boundary between the pilot server and real Hong Kong FM operations. A green local smoke test is not a production sign-off.

## Required external resources

1. Managed PostgreSQL with TLS, point-in-time recovery, daily snapshots and a restricted application role.
2. S3-compatible object storage for proof/camera media and a separate bucket or account for encrypted backups.
3. Enterprise OIDC tenant with MFA, groups/roles and client-scope claims. The token must contain a role and, for scoped users, `client_ids`.
4. A private deployment endpoint with HTTPS, secret manager, log retention, alert routing and health monitoring. `DR_FOREST_DEVICE_SIGNING_SECRET` is a server-side pepper for stored device-key hashes; it is never sent to devices.
5. Real device/gateway inventory: module IDs, device IDs, calibrated metric units, key rotation owner and network egress policy.

## Deployment order

0. Run `npm.cmd run production:preflight -- --url https://ops.example.com --bearer-token <short-lived-token>` from the deployment runner. It must report `status: ready`; `blocked` or `unverified` is a release stop. The preflight is read-only: it does not migrate, seed, or repair the database.
1. Run `node scripts/migrate-sqlite-to-postgres.mjs --dry-run` against the approved source snapshot and review the 27-table inventory.
2. Apply `node scripts/migrate-sqlite-to-postgres.mjs` against a staging PostgreSQL database. The migrator derives the current master-data/device/telemetry/alert/AI/session schema and records a source hash in `ops_migration_runs`.
3. Run `node scripts/verify-postgres-migration.mjs` against the same approved source snapshot and destination database. It must report matching table names, ordered columns, row counts, foreign-key coverage, zero orphan relations and a matching source hash.
4. Verify that the production server's client/asset/work-order/proof/sensor/incident reads are using `postgres-master-data`, then import only an approved tenancy dataset and run relationship validation. An empty production database does not auto-seed demo JSON; do not use demo seed data as live tenancy data.
5. Keep the explicit master-data import behind the admin permission and run it only before dependent modules/devices are registered. Foreign-key constraints intentionally reject an import that would delete referenced operational records.
6. Create the S3 buckets with private access, lifecycle rules, server-side encryption and a malware-scanning/quarantine path. Production proof upload/readback uses the signed S3 PUT/GET path; pilot local-vault files must not be treated as production evidence.
7. Provision the environment variables from `.env.production.example` through a secret manager. Never put credentials in the repository or browser bundle.
8. Start one staging instance with `DR_FOREST_ENV=production`. `/api/health/ready` must be HTTP 200 and list PostgreSQL/S3/OIDC as active backends.
9. Confirm `/api/health/ready` and `/api/storage` report PostgreSQL for master data, modules, devices, telemetry, alerts, AI diagnosis tasks, mobile capture, proof metadata and reminders. Confirm pilot password sessions are disabled and OIDC is active; any remaining SQLite tables must be explicitly accepted in the release record.
10. Run an encrypted backup, upload it off-host, then perform `node scripts/restore-runtime.mjs --backup <path> --verify-only` and one isolated restore drill. The SQLite pilot backup uses `VACUUM INTO` for a consistent snapshot and the restore verifier runs `PRAGMA integrity_check`; this is a local consistency guarantee, not a substitute for a managed PostgreSQL backup/restore drill.
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

The worker claims due tasks, signs the JSON payload with `DR_FOREST_ALERT_WEBHOOK_SECRET`, marks successful deliveries, and applies exponential backoff until `DR_FOREST_NOTIFICATION_MAX_ATTEMPTS`. A missing webhook intentionally leaves tasks pending and returns `skipped`; it is not a delivery pass. Production should attach the webhook to an owned incident/escalation system, monitor failed and retry counts, and retain delivery responses for the release record.

## Device ingress limits

Device telemetry and camera ports require `Content-Type: application/json`. JSON bodies are rejected with HTTP 415 when the content type is wrong and HTTP 413 when the declared or streamed body exceeds the route limit. Reading batches default to 100 records. The default per-minute limits are 1,200 requests per source IP, 300 per sensor/camera device and 1,200 per gateway; tune them from the real gateway sampling plan through the corresponding `DR_FOREST_DEVICE_*` environment variables rather than silently increasing them.

The service also bounds the in-process rate-limit bucket map to 5,000 active keys and removes expired buckets. This protects a single pilot instance from unbounded client-IP cardinality. A production deployment still needs an upstream WAF/API gateway, device-network policy and load testing with the actual gateway topology.

## Client and auditor views

`portal.html?role=client` is a pilot-only read-only client view. It displays only the authenticated principal's client-scoped portfolio, assets, proof evidence and open exceptions. `portal.html?role=auditor` additionally displays the data-quality and ESG evidence-gap panel for a principal with the `esg-auditor` permission. The query parameter is not an authentication mechanism: production must remove the demo selector and use OIDC claims, server-side role checks and database row policies. Neither view has write operations.

`GET /api/ops/timeline` is the internal operations audit projection. It is protected by `ops.events.read`, returns newest-first event records with bounded `limit`, optional `types`, `entityType`, `clientId`, `before` and `beforeId` filters, and returns a cursor when more records are available. SQLite and PostgreSQL now apply those filters and the candidate limit in the database before the server resolves entity ownership and principal scope, so the request does not load the full event history. A client-scope filter is still checked before query construction and the entity resolver remains the final ownership boundary. The `total` and `hasMore` values are projection metadata over the bounded candidate window; production must add reviewed indexes, retention policy and exact-count requirements before treating them as warehouse-grade reporting.

`GET /api/ops/quality` is an internal FM Lead/Platform Admin readiness panel. It is protected by `storage.read` and is intentionally unavailable to client viewers and auditors because it contains platform-wide operational gaps. The response reports four independent gates: complete temperature/humidity/CO2/MC telemetry per module, connected camera endpoints, a three-part service-evidence chain (field batches, verified media and persisted snapshots), and active exception counts. `ready`, `partial`, `blocked` and `attention` are current observations only; they are not a production certification, ESG assurance statement or replacement for incident review.

The quality response also applies freshness and review windows. `DR_FOREST_TELEMETRY_STALE_MINUTES` defaults to `180`, and a module is fresh only when all four required metrics have observations inside that window. `DR_FOREST_CAMERA_STALE_MINUTES` defaults to `1440`, and a camera is fresh only when a registered camera device is active and has a recent `lastSeenAt`; a generated module camera map is not enough. `DR_FOREST_EXCEPTION_SLA_HOURS` defaults to `24`; open alert or pending AI records older than this are labelled `overdue`. These are pilot defaults, not universal FM SLAs: production must approve them per contract, monitor clock skew and retain the change record.

The same response returns a bounded `moduleReadiness` action queue with at most 20 unready modules. It is ordered by incomplete telemetry, stale telemetry, missing camera registration and stale camera heartbeat. The queue is an operator aid, not a complete export; production reporting must use a dedicated paginated module query and retain the selected remediation owner, due time and resolution evidence.

The module queue can create and update internal remediation tasks. `POST /api/remediation/tasks` accepts a scoped `moduleId`, `sourceKey`, `reasons`, `priority`, optional `assignedTo` and optional `dueAt`; repeated active creation for the same module/source is idempotent. The assigned technician starts work through mobile, which records `accepted_by` and `accepted_at`, then submits completion evidence with `submitForReview: true`. This leaves the task active with `review_status = pending`. Only FM Lead or Platform Admin can send `reviewDecision: approved|rejected` with a required review note. Approval resolves the task; rejection returns it to `assigned`. Every acceptance, submission and decision remains attributable in the task row and operations timeline.

This workflow is a control-plane record, not a service certificate. Production must connect its actor IDs to OIDC principals and validate the process through repeated live field cycles. SQLite reports migration `2026-08-27.remediation-review-loop-v1`; PostgreSQL deployments must apply `infra/postgres/003_remediation_tasks.sql`, `004_remediation_work_order_link.sql` and `005_remediation_review_loop.sql`, then pass preflight migration/table checks.

The technician PWA reads `GET /api/mobile/remediation-tasks?statuses=open,assigned,in_progress` and updates `PATCH /api/mobile/remediation-tasks/:id`. A field technician receives only assigned tasks, records acceptance when starting, and submits a capture batch ID or uploaded media ID as `evidenceRef` for FM review. Pending tasks remain visible but locked; rejected tasks expose the FM note and can be resumed. This remains a pilot control until production identity and repeated real-site review cycles are evidenced.

After the data loads, `Download evidence / 下載證據` creates a role-labelled JSON snapshot in the browser. It is useful for pilot review and partner walkthroughs, but it is not a signed report. A production release must replace or supplement it with an immutable server-side snapshot, a signed download URL, retention controls and a delivery acknowledgement.

The portal now calls `GET /api/proof/evidence-snapshot` when exporting. The server assembles the current scoped package and returns `snapshotId`, `hashAlgorithm: sha256` and a 64-character fingerprint. It also returns `signatureAlgorithm: hmac-sha256`, `signatureStatus`, `signatureKeyId` and `signature`. Without `DR_FOREST_EVIDENCE_SIGNING_SECRET`, pilot responses are explicitly `unsigned` and the signature is `null`; this is intentional and must not be presented as signed ESG evidence.

For internal report preparation, FM Lead/Platform Admin can `POST /api/proof/evidence-snapshots`. The server verifies the canonical package hash before inserting an append-only record in `evidence_snapshots`; `GET /api/proof/evidence-snapshots/:snapshotId` rechecks access against the stored client scope. Client viewers have `proof.snapshot.read` but no `proof.snapshot.write`, and an all-portfolio snapshot is not readable by a client-scoped principal.

The portal also calls `GET /api/proof/evidence-snapshots?limit=5` to display metadata for persisted snapshots visible to the current principal. The list is filtered server-side using the stored `client_ids` scope and deliberately omits the package body; a selected row can be downloaded through the scoped `GET /api/proof/evidence-snapshots/:snapshotId` route. A client viewer therefore receives an empty ledger for an all-portfolio snapshot rather than a hidden-but-downloadable record. This is a read-only pilot review surface, not an external assurance portal.

The pilot uses SQLite migration `2026-08-23.evidence-snapshot-v3`. Production uses the matching PostgreSQL adapter and `infra/postgres/002_evidence_snapshots.sql`. Production must load `DR_FOREST_EVIDENCE_SIGNING_SECRET` from a secret manager, keep the key ID stable during its validity window, define rotation and verification ownership, set `DR_FOREST_EVIDENCE_RETENTION_DAYS` between 30 and 3650, and cover the signed record with retention, off-host backup and delivery acknowledgement controls.

FM Lead/Platform Admin can verify a persisted snapshot with `POST /api/proof/evidence-snapshots/:snapshotId`. The endpoint recalculates the package hash and HMAC, persists the verification result and never upgrades an unsigned pilot snapshot to `verified`. A scheduled `POST /api/proof/evidence-snapshots/retention-sweep` or `npm.cmd run evidence:retention` marks expired standard snapshots as `expired`; it does not delete evidence and does not expire `legal-hold` records.

The FM Lead `operations.html` page now exposes these controls under `ESG snapshot ledger`: `Persist current snapshot`, `Verify latest` and `Run retention sweep`. The panel shows the persisted count, verified count, latest snapshot ID, signature status, verification status, hash prefix and expiry. Pilot mode intentionally displays `unsigned`; a visible persisted record is not a signed ESG certification.

## Backup consistency check

`npm.cmd run backup:runtime` records a `2026-08-23.runtime-backup-v2` manifest with `consistency.method: sqlite-vacuum-into` and a source integrity result. `npm.cmd run backup:smoke` copies the current pilot database into an isolated temporary runtime, creates a backup, verifies checksums and restores the database into staging, then checks SQLite integrity before deleting the temporary files. This proves the local backup contract only. Production still requires a managed PostgreSQL backup, off-host retention, encryption-key custody and a dated restore drill.

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
- S3 upload/readback and malware-scan evidence for a real proof image.
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
