import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

export const postgresSchemaRunnerVersion = "2026-08-29.postgres-schema-runner-v1";
const { Pool } = pg;
const migrationsRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "infra", "postgres");
const filePattern = /^\d{3}_[a-z0-9_-]+\.sql$/i;

function databaseUrl(value = process.env.DR_FOREST_DATABASE_URL) {
  const url = String(value || "").trim();
  if (!/^(postgres|postgresql):\/\//i.test(url)) throw new Error("DR_FOREST_DATABASE_URL is required and must use postgres:// or postgresql://");
  return url;
}

function migrationFiles() {
  return readdir(migrationsRoot, { withFileTypes: true }).then((entries) => entries
    .filter((entry) => entry.isFile() && filePattern.test(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, "en", { numeric: true })));
}

async function readMigration(file) {
  const path = join(migrationsRoot, file);
  const text = await readFile(path, "utf8");
  return { file, path, sha256: createHash("sha256").update(text).digest("hex"), bytes: Buffer.byteLength(text), text };
}

async function ensureRunnerTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ops_schema_migration_files (
      filename TEXT PRIMARY KEY,
      sha256 TEXT NOT NULL,
      byte_size BIGINT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL,
      runner_version TEXT NOT NULL
    )
  `);
}

function rowFromDatabase(row) {
  return row ? { filename: row.filename, sha256: row.sha256, bytes: Number(row.byte_size), appliedAt: row.applied_at?.toISOString?.() || row.applied_at, runnerVersion: row.runner_version } : null;
}

async function withLockedClient(url, callback) {
  const pool = new Pool({ connectionString: url, max: 1, connectionTimeoutMillis: 5000, application_name: "dr-forest-postgres-schema-runner" });
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock(hashtext($1))", ["dr-forest:postgres-schema"]);
    await client.query("SET lock_timeout = '10s'; SET statement_timeout = '120s'");
    return await callback(client);
  } finally {
    await client.query("SELECT pg_advisory_unlock(hashtext($1))", ["dr-forest:postgres-schema"]).catch(() => {});
    client.release();
    await pool.end();
  }
}

export async function applyPostgresMigrations({ url = process.env.DR_FOREST_DATABASE_URL, verifyOnly = false } = {}) {
  const files = await Promise.all(await migrationFiles().then((items) => items.map(readMigration)));
  if (!files.length) throw new Error(`No PostgreSQL migrations found in ${migrationsRoot}`);
  return withLockedClient(databaseUrl(url), async (client) => {
    await ensureRunnerTable(client);
    const appliedRows = (await client.query("SELECT filename, sha256, byte_size, applied_at, runner_version FROM ops_schema_migration_files ORDER BY filename")).rows;
    const appliedByFile = new Map(appliedRows.map((row) => [row.filename, rowFromDatabase(row)]));
    const report = { version: postgresSchemaRunnerVersion, database: "postgresql", migrationsRoot, verifyOnly, files: [], status: "verified" };
    for (const migration of files) {
      const prior = appliedByFile.get(migration.file);
      if (prior && prior.sha256 !== migration.sha256) {
        throw Object.assign(new Error(`Migration checksum changed after it was applied: ${migration.file}`), { code: "POSTGRES_MIGRATION_DRIFT" });
      }
      if (verifyOnly) {
        report.files.push({ filename: migration.file, sha256: migration.sha256, bytes: migration.bytes, status: prior ? "verified" : "missing" });
        if (!prior) report.status = "blocked";
        continue;
      }
      if (prior) {
        report.files.push({ filename: migration.file, sha256: migration.sha256, bytes: migration.bytes, status: "already-applied", appliedAt: prior.appliedAt });
        continue;
      }
      await client.query(migration.text);
      const recorded = await client.query(`INSERT INTO ops_schema_migration_files(filename, sha256, byte_size, applied_at, runner_version) VALUES($1,$2,$3,NOW(),$4) RETURNING applied_at`, [migration.file, migration.sha256, migration.bytes, postgresSchemaRunnerVersion]);
      report.files.push({ filename: migration.file, sha256: migration.sha256, bytes: migration.bytes, status: "applied", appliedAt: recorded.rows[0].applied_at?.toISOString?.() || recorded.rows[0].applied_at });
    }
    report.appliedCount = report.files.filter((item) => item.status === "applied").length;
    report.verifiedCount = report.files.filter((item) => ["verified", "already-applied", "applied"].includes(item.status)).length;
    report.missingCount = report.files.filter((item) => item.status === "missing").length;
    if (report.status === "blocked") throw Object.assign(new Error("PostgreSQL migration verification is incomplete"), { code: "POSTGRES_MIGRATION_INCOMPLETE", report });
    return report;
  });
}

export async function writeMigrationReport(path, report) {
  await writeFile(resolve(path), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return report;
}
