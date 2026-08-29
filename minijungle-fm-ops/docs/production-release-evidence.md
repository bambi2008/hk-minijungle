# Production Release Evidence Ledger

The release evidence ledger records the external checks required before DR FOREST OPS can be treated as production-ready. It is an internal control surface for the FM Lead, Platform Admin and ESG Auditor; it is not an assurance certificate.

## Required evidence

The seeded checklist covers full PostgreSQL migration, off-host restore, a signed-device pilot, repeated multi-client operations, hosted monitoring and alert recovery, AI provider evaluation, and media malware scanning. Every record stores an artifact reference, SHA-256 digest, observation time, optional expiry, submission note and actor.

## Operator path

1. Open **Production gate ledger** in Ops Today.
2. Submit an `https://`, `s3://` or controlled `evidence://` artifact reference and its SHA-256 digest.
3. A different Platform Admin reviews the submission and records a decision note.
4. Keep the source artifact, dated drill output and approval record together in the release evidence folder.
5. Re-submit a new record when evidence expires or is rejected; the previous record remains in the event history.

## API contract

- `GET /api/production/evidence` returns the checklist, latest record per gate, summary and storage health.
- `POST /api/production/evidence` requires `production.evidence.write` and an `Idempotency-Key`.
- `POST /api/production/evidence/:id/review` requires `production.evidence.verify`, an `Idempotency-Key`, `expectedUpdatedAt` and a review note.
- `GET /api/production/evidence/:id/events` returns the append-only submission/review history.

The submitter cannot verify the same record. A verified record with an expired `expiresAt` is reported as `expired`, so release operators cannot mistake stale evidence for current evidence.

## Production boundary

SQLite is the pilot backend. PostgreSQL deployment SQL is `infra/postgres/017_release_evidence_ledger.sql`. The ledger is an application control and does not prove that any external check has happened. The official production operations score remains **65%** until the required live evidence is attached and the managed PostgreSQL/off-host recovery hard cap is cleared.
