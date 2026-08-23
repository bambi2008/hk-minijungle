import { summarizeMigration } from "./verify-postgres-migration.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const pass = summarizeMigration({ sourceTables: [{ name: "clients" }], targetTables: [{ name: "clients" }], sourceCounts: { clients: 4 }, targetCounts: { clients: 4 }, missingTables: [], rowDrift: [], columnDrift: [], foreignKeyDrift: [], orphanRows: [], sourceHash: "abc", recordedHash: "abc" });
assert(pass.ok, "Matching migration summary should pass");

const fail = summarizeMigration({ sourceTables: [{ name: "clients" }], targetTables: [], sourceCounts: { clients: 4 }, targetCounts: { clients: 0 }, missingTables: ["clients"], rowDrift: [{ table: "clients", source: 4, target: 0 }], columnDrift: [], foreignKeyDrift: [], orphanRows: [], sourceHash: "abc", recordedHash: "def" });
assert(!fail.ok && fail.failures.length === 3, "Missing table, row drift and hash mismatch must fail");
console.log(JSON.stringify({ ok: true, matching: pass.ok, blockedFailures: fail.failures.length }, null, 2));
