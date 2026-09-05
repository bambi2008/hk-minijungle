import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import assert from "node:assert/strict";
import { applyPostgresMigrations } from "../lib/ops-postgres-migrations.mjs";

const migrationRoot = resolve("infra/postgres");
const files = (await readdir(migrationRoot)).filter((name) => /^\d{3}_[a-z0-9_-]+\.sql$/i.test(name)).sort((left, right) => left.localeCompare(right, "en", { numeric: true }));
assert.equal(files[0], "000_master_data_and_ingestion.sql");
assert.equal(files.at(-1), "021_client_service_feedback.sql");
assert.equal(files.length, 22);
const base = await readFile(join(migrationRoot, files[0]), "utf8");
for (const table of ["clients", "living_assets", "work_orders", "asset_modules", "asset_devices", "sensor_reading_history"]) assert.match(base, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
const field = await readFile(join(migrationRoot, "019_field_service_cycles.sql"), "utf8");
assert.match(field, /ops_field_service_cycles/);
const scan = await readFile(join(migrationRoot, files.at(-1)), "utf8");
assert.match(scan, /ops_client_service_feedback/);
await assert.rejects(() => applyPostgresMigrations({ url: "not-a-postgres-url" }), /DR_FOREST_DATABASE_URL/);
console.log(JSON.stringify({ ok: true, migrationCount: files.length, first: files[0], last: files.at(-1), invalidUrlFailClosed: true }, null, 2));
