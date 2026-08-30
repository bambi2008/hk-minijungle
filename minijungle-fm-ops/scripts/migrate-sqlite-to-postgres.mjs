import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import pg from "pg";

const { Pool } = pg;
const ignoredTables = new Set(["schema_migrations"]);
const sourcePath = resolve(arg("--sqlite") || process.env.DR_FOREST_RUNTIME_DB_PATH || ".ops-data/ops-runtime.sqlite");
const dryRun = process.argv.includes("--dry-run");

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}
function quoteIdentifier(value) { return `"${String(value).replaceAll('"', '""')}"`; }
function safeConstraintName(value) {
  const base = String(value).replace(/[^a-zA-Z0-9_]+/g, "_").slice(0, 48);
  return `${base}_${createHash("sha1").update(value).digest("hex").slice(0, 8)}`;
}
function postgresType(type) {
  const value = String(type || "TEXT").toUpperCase();
  if (value.includes("INT")) return "BIGINT";
  if (value.includes("CHAR") || value.includes("CLOB") || value.includes("TEXT")) return "TEXT";
  if (value.includes("REAL") || value.includes("FLOA") || value.includes("DOUB")) return "DOUBLE PRECISION";
  if (value.includes("BLOB")) return "BYTEA";
  if (value.includes("BOOL")) return "BOOLEAN";
  if (value.includes("NUM") || value.includes("DEC")) return "NUMERIC";
  return "TEXT";
}
function sqliteValue(value) {
  if (value === undefined) return null;
  if (typeof value === "bigint") return Number(value);
  return value;
}
function tableMetadata(db) {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map((row) => row.name).filter((name) => !ignoredTables.has(name));
  return tables.map((name) => {
    const columns = db.prepare(`PRAGMA table_info(${quoteIdentifier(name)})`).all();
    const foreignKeys = db.prepare(`PRAGMA foreign_key_list(${quoteIdentifier(name)})`).all();
    const indexes = db.prepare(`PRAGMA index_list(${quoteIdentifier(name)})`).all().filter((index) => index.origin === "u").map((index) => ({
      name: index.name,
      columns: db.prepare(`PRAGMA index_info(${quoteIdentifier(index.name)})`).all().sort((left, right) => left.seqno - right.seqno).map((column) => column.name)
    }));
    return { name, columns, foreignKeys, indexes };
  });
}
function targetColumnName(tableName, columnName) {
  if (tableName === "evidence_snapshots" && columnName === "client_ids_json") return "client_ids";
  return columnName;
}
function primaryKeyColumns(table) { return table.columns.filter((column) => Number(column.pk) > 0).sort((left, right) => left.pk - right.pk).map((column) => column.name); }
function groupedForeignKeys(table) {
  const groups = new Map();
  for (const row of table.foreignKeys) {
    if (!groups.has(row.id)) groups.set(row.id, { table: row.table, onUpdate: row.on_update, onDelete: row.on_delete, from: [], to: [] });
    const group = groups.get(row.id);
    group.from[row.seq] = row.from;
    group.to[row.seq] = row.to;
  }
  return [...groups.values()];
}

function copyOrder(tables) {
  const pending = new Map(tables.map((table) => [table.name, table]));
  const ordered = [];
  while (pending.size) {
    const ready = [...pending.values()]
      .filter((table) => groupedForeignKeys(table).every((foreignKey) => foreignKey.table === table.name || !pending.has(foreignKey.table)))
      .sort((left, right) => left.name.localeCompare(right.name));
    if (!ready.length) {
      throw new Error(`Cannot determine a safe PostgreSQL copy order; foreign-key cycle remains among: ${[...pending.keys()].sort().join(", ")}`);
    }
    for (const table of ready) {
      ordered.push(table);
      pending.delete(table.name);
    }
  }
  return ordered;
}

async function ensureTables(client, tables) {
  for (const table of tables) {
    const primary = primaryKeyColumns(table);
    const definitions = table.columns.map((column) => {
      const pieces = [quoteIdentifier(column.name), postgresType(column.type)];
      if (Number(column.notnull) === 1 && !primary.includes(column.name)) pieces.push("NOT NULL");
      return pieces.join(" ");
    });
    if (primary.length) definitions.push(`PRIMARY KEY (${primary.map(quoteIdentifier).join(", ")})`);
    await client.query(`CREATE TABLE IF NOT EXISTS ${quoteIdentifier(table.name)} (${definitions.join(", ")})`);
  }
  for (const table of tables) {
    for (const index of table.indexes) {
      await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS ${quoteIdentifier(safeConstraintName(`ux_${table.name}_${index.name}`))} ON ${quoteIdentifier(table.name)} (${index.columns.map(quoteIdentifier).join(", ")})`);
    }
  }
  for (const table of tables) {
    for (const foreignKey of groupedForeignKeys(table)) {
      const constraint = safeConstraintName(`fk_${table.name}_${foreignKey.from.join("_")}`);
      const clause = `ALTER TABLE ${quoteIdentifier(table.name)} ADD CONSTRAINT ${quoteIdentifier(constraint)} FOREIGN KEY (${foreignKey.from.map(quoteIdentifier).join(", ")}) REFERENCES ${quoteIdentifier(foreignKey.table)} (${foreignKey.to.map(quoteIdentifier).join(", ")})`;
      const existing = await client.query("SELECT 1 FROM pg_constraint WHERE conname = $1 AND conrelid = to_regclass($2)", [constraint, table.name]);
      if (existing.rowCount) continue;
      await client.query("SAVEPOINT add_foreign_key");
      try {
        await client.query(clause);
        await client.query("RELEASE SAVEPOINT add_foreign_key");
      } catch (error) {
        await client.query("ROLLBACK TO SAVEPOINT add_foreign_key");
        await client.query("RELEASE SAVEPOINT add_foreign_key");
        if (!String(error?.message || "").toLowerCase().includes("already exists")) throw error;
      }
    }
  }
}

async function copyTable(client, db, table) {
  const columns = table.columns.map((column) => column.name);
  const targetColumns = columns.map((column) => targetColumnName(table.name, column));
  if (new Set(targetColumns).size !== targetColumns.length) throw new Error(`Target column mapping is ambiguous for ${table.name}`);
  const rows = db.prepare(`SELECT ${columns.map(quoteIdentifier).join(", ")} FROM ${quoteIdentifier(table.name)}`).all();
  const primary = primaryKeyColumns(table);
  const targetPrimary = primary.map((column) => targetColumnName(table.name, column));
  const updates = columns.filter((column) => !primary.includes(column)).map((column) => {
    const targetColumn = targetColumnName(table.name, column);
    return `${quoteIdentifier(targetColumn)} = EXCLUDED.${quoteIdentifier(targetColumn)}`;
  }).join(", ");
  const conflict = targetPrimary.length ? (updates ? ` ON CONFLICT (${targetPrimary.map(quoteIdentifier).join(", ")}) DO UPDATE SET ${updates}` : ` ON CONFLICT (${targetPrimary.map(quoteIdentifier).join(", ")}) DO NOTHING`) : "";
  for (const row of rows) {
    const values = columns.map((column) => sqliteValue(row[column]));
    const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");
    await client.query(`INSERT INTO ${quoteIdentifier(table.name)} (${targetColumns.map(quoteIdentifier).join(", ")}) VALUES (${placeholders})${conflict || " ON CONFLICT DO NOTHING"}`, values);
  }
  return rows.length;
}

const database = new DatabaseSync(sourcePath, { readOnly: true });
const tables = tableMetadata(database);
const counts = Object.fromEntries(tables.map((table) => [table.name, database.prepare(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(table.name)}`).get().count]));

if (dryRun) {
  database.close();
  console.log(JSON.stringify({ ok: true, dryRun: true, sourcePath, ignoredTables: [...ignoredTables], copyOrder: copyOrder(tables).map((table) => table.name), tables: tables.map((table) => ({ name: table.name, columns: table.columns.length, foreignKeys: groupedForeignKeys(table).length, rows: counts[table.name] })) }, null, 2));
  process.exit(0);
}

const databaseUrl = String(process.env.DR_FOREST_DATABASE_URL || "").trim();
if (!/^(postgres|postgresql):\/\//i.test(databaseUrl)) throw new Error("DR_FOREST_DATABASE_URL is required and must use postgres:// or postgresql://");
const pool = new Pool({ connectionString: databaseUrl, max: 4, connectionTimeoutMillis: 5_000, application_name: "dr-forest-sqlite-migrator" });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  await ensureTables(client, tables);
  const copied = {};
  const orderedTables = copyOrder(tables);
  for (const table of orderedTables) copied[table.name] = await copyTable(client, database, table);
  await client.query(`CREATE TABLE IF NOT EXISTS ops_migration_runs (id TEXT PRIMARY KEY, source_path TEXT NOT NULL, source_sha256 TEXT, table_count INTEGER NOT NULL, copied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  const sourceSha256 = createHash("sha256").update(await (await import("node:fs/promises")).readFile(sourcePath)).digest("hex");
  await client.query("INSERT INTO ops_migration_runs (id, source_path, source_sha256, table_count) VALUES ($1, $2, $3, $4)", [`MIG-${Date.now()}`, sourcePath, sourceSha256, tables.length]);
  await client.query("COMMIT");
  console.log(JSON.stringify({ ok: true, sourcePath, destination: "postgresql", tables: tables.length, copyOrder: orderedTables.map((table) => table.name), sourceRows: counts, copiedRows: copied, sourceSha256 }, null, 2));
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  database.close();
  client.release();
  await pool.end();
}
