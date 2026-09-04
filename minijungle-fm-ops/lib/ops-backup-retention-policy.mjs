export const backupRetentionPolicyVersion = "2026-09-04.backup-retention-v1";

function positiveInteger(value, fallback, field, maximum) {
  const number = value === undefined || value === null || value === "" ? fallback : Number(value);
  if (!Number.isInteger(number) || number < 1 || number > maximum) throw new Error(`${field} must be an integer from 1 to ${maximum}`);
  return number;
}

export function readBackupRetentionPolicy(env = process.env) {
  return {
    version: backupRetentionPolicyVersion,
    retentionDays: positiveInteger(env.DR_FOREST_BACKUP_RETENTION_DAYS, 30, "DR_FOREST_BACKUP_RETENTION_DAYS", 3650),
    retentionCount: positiveInteger(env.DR_FOREST_BACKUP_RETENTION_COUNT, 30, "DR_FOREST_BACKUP_RETENTION_COUNT", 1000),
    enforcement: "cos-lifecycle-and-local-plan"
  };
}

export function planBackupRetention(entries, { now = new Date(), retentionDays = 30, retentionCount = 30 } = {}) {
  const cutoff = new Date(now).getTime() - Number(retentionDays) * 24 * 60 * 60 * 1000;
  const ordered = [...entries]
    .filter((entry) => entry && entry.path)
    .sort((left, right) => String(right.createdAt || "").localeCompare(String(left.createdAt || "")) || String(right.path).localeCompare(String(left.path)));
  const keep = [];
  const remove = [];
  for (const entry of ordered) {
    const createdAt = new Date(entry.createdAt || 0).getTime();
    const expired = Number.isFinite(createdAt) && createdAt < cutoff;
    if (keep.length < Number(retentionCount) && !expired) keep.push(entry);
    else remove.push({ ...entry, reason: expired ? "older-than-retention-days" : "exceeds-retention-count" });
  }
  return { version: backupRetentionPolicyVersion, cutoff: new Date(cutoff).toISOString(), keep, remove };
}
