# Preventive Maintenance Planning v1

## Purpose

This domain turns each living asset's service cadence into an auditable chain:

`maintenance plan -> dated occurrence -> work order -> workforce assignment -> technician phone route -> field evidence`

It is the source for future preventive work. Airtable CSV remains an approved migration path for maintenance history; it is not the live scheduling database.

## Operator flow

1. Open **Ops Today > Preventive Planning**.
2. Review `Plan gaps`. A gap means an active plan's next due date is before today and has not yet been generated.
3. Select a horizon of no more than 90 days and choose **Generate due work orders**.
4. Review generated work. `Needs owner` means the work exists but no technician can see it yet.
5. Select a registered technician and choose **Assign**. Eligibility, skill, district, shift, overlap and daily capacity are checked by the workforce policy.
6. The assigned work order becomes available through the technician phone route. Field evidence and FM review continue through the existing mobile workflow.

## Persistence and duplicate control

- `ops_maintenance_plans` stores cadence, next due date, duration, checklist and skills per asset/service type.
- `ops_maintenance_occurrences` uniquely binds a plan and service date to one ordinary `work_orders` row.
- `ops_maintenance_generation_runs` records each completed generation window and counts.
- Work-order IDs are deterministic from plan and service date.
- A database transaction writes work orders, occurrences, run evidence and the next plan cursor together.
- `Idempotency-Key` returns the original API result on a retry.
- A named job lease prevents two scheduler instances from generating concurrently.
- A 90-day horizon and 1,000-occurrence limit bound one run.

SQLite migration: `2026-08-31.maintenance-planning-v1`.

PostgreSQL migration: `2026-08-31.postgres-maintenance-planning-v1`, deployable through `infra/postgres/009_maintenance_planning.sql`.

## Pilot seed and production rule

Pilot mode initializes one clearly labelled plan from each asset's legacy cadence only when the planning ledger is empty. PostgreSQL production does not create sample plans. Production plans must be imported or approved by an authorized FM operator.

## Honest boundary

The planner does not optimize travel, ingest technician leave, auto-assign work, or prove real field adoption. A generated but unassigned work order is deliberately shown as incomplete. Managed PostgreSQL, production identity, scheduler uptime, off-host restore and repeated live-site execution remain external evidence requirements.
