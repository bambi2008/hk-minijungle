# Customer Field-Service Data Import

Use Airtable as the temporary capture surface, then import the reviewed export into the DR FOREST OPS field-service ledger. The import is a data write, not a production-readiness claim.

## Required Airtable columns

`cycle_id`, `client_id`, `work_order_id`, `module_id`, `technician_id`, `service_at`, `status`, `duration_minutes`, `proof_refs`, `outcome`, `notes`

`proof_refs` accepts one or more `https://`, `s3://` or controlled `evidence://` references separated by `;`.

## Review and apply

```powershell
npm.cmd run import:field-cycles -- --input .\field-cycles.csv --format csv
npm.cmd run import:field-cycles -- --input .\field-cycles.csv --format csv --apply --actor fm-lead
```

In `DR_FOREST_ENV=production`, the same command writes to PostgreSQL through `pg` and requires `DR_FOREST_DATABASE_URL`. In pilot mode it writes to `DR_FOREST_RUNTIME_DB_PATH` or `.ops-data/ops-runtime.sqlite`.

The command validates every row before writing. It rejects malformed IDs, future service times, duplicate cycle IDs, missing evidence references and missing or cross-client parent records. Writes are idempotent by `cycle_id`: a repeated export updates the same record instead of creating a second visit.

The import can be a valid partial history. The returned gate status becomes `verified` only when there are at least two completed cycles for each of at least two clients. That gate is evaluated separately from the fact that individual rows were persisted.

The web API exposes the same control:

- `GET /api/field-service/cycles` reads records within the caller's client scope.
- `POST /api/admin/field-service/cycles/import` accepts `{ "cycles": [...] }` or `{ "csv": "..." }` and requires `master.data.import`.

Real customer records must retain the original Airtable export, checksum, operator, import time and proof references in the evidence folder. Do not replace real records with generated demo IDs.
