# Operations Reliability Center v1

## Purpose

The reliability center answers one operational question: are the background jobs that protect service delivery still running on schedule?

It monitors five jobs: the reliability watchdog, notification delivery, remediation SLA scanning, preventive-maintenance generation and runtime backup. Each execution records its owner, start, heartbeat, finish, duration, result or failure. A stale, stalled, failed or never-run job opens one incident; a later successful run recovers that same incident.

## Operator Path

Ops Today shows the current state and latest run for every monitored job. `Run check` evaluates freshness, opens or recovers incidents, writes an operations-timeline event and places an idempotent failure or recovery message in the existing notification outbox.

The shortest production schedule is:

```text
*/5 * * * * npm run reliability:once
*/5 * * * * npm run notifications:once -- --strict
0 * * * * call POST /api/remediation/sla-scan with a production service identity
15 1 * * * call POST /api/maintenance/generate with a production service identity and horizon
30 2 * * * npm run backup:runtime -- --encrypt
```

Raw cron expressions are deployment examples, not evidence that a scheduler is installed. Production needs a hosted scheduler, restricted service identity, centralized logs and a dated alert-delivery/recovery drill.

## Data Model

- `ops_reliability_jobs`: expected interval, stale threshold and last known state inputs.
- `ops_reliability_runs`: immutable execution history and bounded result/error data.
- `ops_reliability_incidents`: open and recovered automation failures without duplicate incident creation.

SQLite supports controlled pilots. PostgreSQL migration `011_reliability_center.sql` provides the production schema. The production preflight requires all three tables and PostgreSQL-backed reliability health.

## Honest Boundary

Local tests prove state transitions, permissions, persistence and UI behavior. They do not prove hosted scheduler uptime, real webhook delivery, on-call acknowledgement or recovery notification. `DR_FOREST_MONITORING_VERIFIED` must stay unverified until a dated external drill demonstrates the complete route.
