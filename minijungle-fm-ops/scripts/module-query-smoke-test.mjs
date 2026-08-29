import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { importSqliteMasterData } from "../lib/ops-master-data-store.mjs";
import { listSqliteModulePage } from "../lib/ops-module-store.mjs";

const dataRoot = join(dirname(fileURLToPath(import.meta.url)), "../data");
const tempRoot = await mkdtemp(join(tmpdir(), "dr-forest-module-query-"));
const dbPath = join(tempRoot, "module-query.sqlite");

try {
  await importSqliteMasterData(dbPath, dataRoot);
  const first = await listSqliteModulePage(dbPath, dataRoot, { limit: 3 });
  assert.equal(first.items.length, 3);
  assert.equal(first.page.total, 12);
  assert.equal(first.page.hasMore, true);
  assert.ok(first.page.nextCursor);

  const second = await listSqliteModulePage(dbPath, dataRoot, { limit: 3, cursor: first.page.nextCursor });
  assert.equal(second.items.length, 3);
  assert.equal(new Set([...first.items, ...second.items].map((item) => item.id)).size, 6);
  assert.ok(second.items[0].id > first.items.at(-1).id || second.items[0].assetId !== first.items.at(-1).assetId);

  const searched = await listSqliteModulePage(dbPath, dataRoot, { search: "MJ-HK-021-M01", limit: 20 });
  assert.deepEqual(searched.items.map((item) => item.id), ["MJ-HK-021-M01"]);
  const scoped = await listSqliteModulePage(dbPath, dataRoot, { clientIds: ["show-suite"], limit: 20 });
  assert.equal(scoped.page.total, 3);
  assert.ok(scoped.items.every((item) => item.clientId === "show-suite"));
  const emptyScope = await listSqliteModulePage(dbPath, dataRoot, { clientIds: [], limit: 20 });
  assert.equal(emptyScope.page.total, 0);

  await assert.rejects(() => listSqliteModulePage(dbPath, dataRoot, { cursor: "not-a-module-cursor" }), (error) => error.code === "MODULE_QUERY_CURSOR_INVALID");
  console.log(JSON.stringify({ ok: true, total: first.page.total, pageSize: first.page.limit, searched: searched.items[0].id, scoped: scoped.page.total }, null, 2));
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
