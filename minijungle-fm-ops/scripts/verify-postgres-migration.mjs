import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import pg from "pg";

const { Pool } = pg;
const sourcePath = resolve(arg("--sqlite") || process.env.DR_FOREST_RUNTIME_DB_PATH || ".ops-data/ops-runtime.sqlite");

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function quoteIdentifier(value) { return `"${String(value).replaceAll('"', '""')}"`; }
function databaseUrl() { return String(process.env.DR_FOREST_DATABASE_URL || "").trim(); }
function validDatabaseUrl(value) { return /^(postgres|postgresql):\/\//i.test(value); }
function groupedForeignKeys(table) {
  const groups = new Map();
  for (const row of table.foreignKeys) {
    if (!groups.has(row.id)) groups.set(row.id, { table: row.table, from: [], to: [] });
    const group = groups.get(row.id);
    group.from[row.seq] = row.from;
    group.to[row.seq] = row.to;
  }
  return [...groups.values()];
}

function tableMetadata(db) {
  const names = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map((row) => row.name);
  return names.map((name) => ({
    name,
    columns: db.prepare(`PRAGMA table_info(${quoteIdentifier(name)})`).all().map((column) => column.name),
    foreignKeys: groupedForeignKeys({ foreignKeys: db.prepare(`PRAGMA foreign_key_list(${quoteIdentifier(name)})`).all() })
  }));
}

function rowCount(db, table) { return Number(db.prepare(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(table)}`).get().count); }
function sourceSha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function equalColumns(source, target) { return source.length === target.length && source.every((column, index) => column === target[index]); }

export function summarizeMigration({ sourceTables, targetTables, sourceCounts, targetCounts, missingTables, rowDrift, columnDrift, foreignKeyDrift, orphanRows, sourceHash, recordedHash }) {
  const failures = [];
  if (missingTables.length) failures.push({ type: "missing-tables", tables: missingTables });
  if (rowDrift.length) failures.push({ type: "row-count-drift", tables: rowDrift });
  if (columnDrift.length) failures.push({ type: "column-drift", tables: columnDrift });
  if (foreignKeyDrift.length) failures.push({ type: "foreign-key-drift", tables: foreignKeyDrift });
  if (orphanRows.length) failures.push({ type: "orphan-rows", relations: orphanRows });
  if (recordedHash && recordedHash !== sourceHash) failures.push({ type: "source-hash-mismatch", expected: recordedHash, actual: sourceHash });
  return {
    ok: failures.length === 0,
    sourceTables: sourceTables.length,
    targetTables: targetTables.length,
    sourceCounts,
    targetCounts,
    sourceHash,
    recordedHash: recordedHash || null,
    failures
  };
}

async function verify() {
  const url = databaseUrl();
  if (!validDatabaseUrl(url)) {
    console.log(JSON.stringify({ ok: true, skipped: true, reason: "DR_FOREST_DATABASE_URL is not configured in this workspace" }, null, 2));
    return;
  }
  const sourceBytes = await readFile(sourcePath);
  const db = new DatabaseSync(sourcePath, { readOnly: true });
  const sourceTables = tableMetadata(db);
  const sourceCounts = Object.fromEntries(sourceTables.map((table) => [table.name, rowCount(db, table.name)]));
  const pool = new Pool({ connectionString: url, max: 3, connectionTimeoutMillis: 5000, application_name: "dr-forest-migration-verifier" });
  const client = await pool.connect();
  try {
    const targetNames = (await client.query("SELECT tablename AS name FROM pg_tables WHERE schemaname = current_schema() ORDER BY tablename")).rows.map((row) => row.name);
    const targetTables = [];
    const missingTables = [];
    const rowDrift = [];
    const columnDrift = [];
    const foreignKeyDrift = [];
    const orphanRows = [];
    const targetCounts = {};
    for (const sourceTable of sourceTables) {
      if (!targetNames.includes(sourceTable.name)) { missingTables.push(sourceTable.name); continue; }
      const count = Number((await client.query(`SELECT COUNT(*)::int AS count FROM ${quoteIdentifier(sourceTable.name)}`)).rows[0].count);
      targetCounts[sourceTable.name] = count;
      if (count !== sourceCounts[sourceTable.name]) rowDrift.push({ table: sourceTable.name, source: sourceCounts[sourceTable.name], target: count });
      const columns = (await client.query("SELECT column_name AS name FROM information_schema.columns WHERE table_schema=current_schema() AND table_name=$1 ORDER BY ordinal_position", [sourceTable.name])).rows.map((row) => row.name);
      targetTables.push({ name: sourceTable.name, columns });
      if (!equalColumns(sourceTable.columns, columns)) columnDrift.push({ table: sourceTable.name, source: sourceTable.columns, target: columns });
      const fkCount = Number((await client.query("SELECT COUNT(*)::int AS count FROM information_schema.table_constraints WHERE table_schema=current_schema() AND table_name=$1 AND constraint_type='FOREIGN KEY'", [sourceTable.name])).rows[0].count);
      if (fkCount < sourceTable.foreignKeys.length) foreignKeyDrift.push({ table: sourceTable.name, source: sourceTable.foreignKeys.length, target: fkCount });
      for (const foreignKey of sourceTable.foreignKeys) {
        const join = foreignKey.from.map((column, index) => `child.${quoteIdentifier(column)} = parent.${quoteIdentifier(foreignKey.to[index])}`).join(" AND ");
        const where = foreignKey.from.map((column) => `child.${quoteIdentifier(column)} IS NOT NULL`).join(" AND ");
        const sql = `SELECT COUNT(*)::int AS count FROM ${quoteIdentifier(sourceTable.name)} child LEFT JOIN ${quoteIdentifier(foreignKey.table)} parent ON ${join} WHERE ${where} AND ${foreignKey.to.map((column) => `parent.${quoteIdentifier(column)} IS NULL`).join(" AND ")}`;
        const count = Number((await client.query(sql)).rows[0].count);
        if (count) orphanRows.push({ table: sourceTable.name, referencedTable: foreignKey.table, count });
      }
    }
    const migration = (await client.query("SELECT source_sha256 FROM ops_migration_runs ORDER BY copied_at DESC LIMIT 1")).rows[0];
    const report = summarizeMigration({ sourceTables, targetTables, sourceCounts, targetCounts, missingTables, rowDrift, columnDrift, foreignKeyDrift, orphanRows, sourceHash: sourceSha256(sourceBytes), recordedHash: migration?.source_sha256 || null });
    console.log(JSON.stringify({ ...report, destination: "postgresql", sourcePath }, null, 2));
    if (!report.ok) process.exitCode = 2;
  } finally {
    db.close();
    client.release();
    await pool.end();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await verify();
