# Airtable Maintenance Import

> Scope: historical and transitional maintenance records. Future preventive work is controlled by the database-backed maintenance planner documented in `preventive-maintenance-planning.md`.

Use Airtable as the temporary capture surface and DR FOREST OPS as the controlled operational record. The import does not require an Airtable account connection or API token.

## Recommended Airtable columns

| CSV field | Required | Meaning |
| --- | --- | --- |
| `record_id` | Yes | Stable Airtable record ID or another permanent unique ID. Never recycle it. |
| `wall_id` | Yes | Existing DR FOREST living-asset ID, for example `MJ-HK-021`. |
| `service_date` | Yes | ISO date or date-time for the visit. |
| `status` | No | `Scheduled`, `In Progress`, `Completed` or `Cancelled`. |
| `priority` | No | `critical`, `high`, `medium` or `low`. |
| `technician_id` | No | Future OIDC/principal ID for the technician. |
| `tasks` | No | Semicolon-separated maintenance items. |
| `notes` | No | Maintenance summary; quoted CSV commas/newlines are supported. |
| `updated_at` | No | Airtable last-modified date-time for traceability. |

## Operator flow

1. Download `/api/admin/imports/maintenance/template.csv` from Ops Today.
2. Export the Airtable maintenance view as CSV without renaming the required fields.
3. Select the file and click `Preview`.
4. Resolve every reported row error in Airtable and export again. A batch with any invalid row cannot be applied.
5. Click `Apply valid batch` once the preview reports zero invalid rows.
6. Confirm the recent-import row is `applied` and the operations timeline contains `maintenance.import.applied`.

## Data behavior

- The raw file is represented by a SHA-256 checksum; an identical export returns the existing preview.
- Work-order IDs are deterministic `AIR-*` identifiers derived from `record_id`.
- The source record ID, technician, note and Airtable update time remain in the work order raw record.
- Import is restricted to principals with `master.data.write`; asset tenancy is checked again during apply.
- Keep the Airtable CSV export and the applied batch ID in the migration evidence folder until Airtable is retired.

This path is suitable for controlled pilot migration. It is not live two-way synchronization, conflict resolution against edits made in both systems, or proof that a service visit occurred.

## Atomic apply v1

The apply step uses the `2026-08-29.atomic-maintenance-import-v1` transaction service. On SQLite and PostgreSQL, the normalized Airtable rows are upserted into `work_orders`, the import batch is changed from `previewed` to `applied`, and the `maintenance.import.applied` event is inserted in one database transaction. A foreign-key, validation or event-write failure rolls back all three effects.

The batch-specific lease still prevents two Ops workers from applying the same batch concurrently, while the applied status makes a retry return the existing result without writing a second work order or audit event. This closes the previous partial-apply gap for the supported database backend. It does not make Airtable a live sync source, solve conflict resolution, or prove that the underlying service visit occurred.

## Source freshness guard

When an Airtable export includes `updated_at`, the import compares it with the existing `sourceUpdatedAt` stored on the same stable `AIR-*` work order. An older export is marked blocked during preview and cannot apply; the transaction service repeats the comparison at apply time to cover the preview-to-apply race. A newer or equal source version may update the existing work order without creating a duplicate. If the source omits `updated_at`, the platform cannot establish ordering and accepts the row under the existing controlled-import policy.
