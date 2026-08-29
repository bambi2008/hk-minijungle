export const moduleQueryVersion = "2026-08-29.module-portfolio-query-v1";
export const moduleQueryMaxPageSize = 100;
const cursorPositionMax = 2147483647;

function queryError(message, code = "MODULE_QUERY_INVALID", status = 400) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

function text(value, field, maxLength = 120) {
  const result = String(value ?? "").trim();
  if (result.length > maxLength) throw queryError(`${field} is too long`);
  return result;
}

function list(value, field, maxItems = 20) {
  const values = Array.isArray(value) ? value : String(value ?? "").split(",");
  const result = [...new Set(values.map((item) => String(item ?? "").trim()).filter(Boolean))];
  if (result.length > maxItems) throw queryError(`${field} contains too many values`);
  return result;
}

function positionRank(value) {
  if (value === null || value === undefined || value === "") return cursorPositionMax;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > cursorPositionMax) throw queryError("module cursor position is invalid", "MODULE_QUERY_CURSOR_INVALID");
  return number;
}

export function encodeModuleCursor(module) {
  const payload = {
    assetId: text(module?.assetId, "module cursor assetId", 200),
    position: positionRank(module?.position),
    id: text(module?.id, "module cursor id", 200)
  };
  if (!payload.assetId || !payload.id) throw queryError("module cursor requires assetId and id", "MODULE_QUERY_CURSOR_INVALID");
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeModuleCursor(value) {
  if (!value) return null;
  try {
    const payload = JSON.parse(Buffer.from(String(value), "base64url").toString("utf8"));
    if (!payload || typeof payload !== "object") throw new Error("not an object");
    const assetId = text(payload.assetId, "module cursor assetId", 200);
    const id = text(payload.id, "module cursor id", 200);
    if (!assetId || !id) throw new Error("missing cursor key");
    return { assetId, position: positionRank(payload.position), id };
  } catch {
    throw queryError("module cursor is invalid", "MODULE_QUERY_CURSOR_INVALID");
  }
}

export function normalizeModuleQuery(input = {}) {
  const rawLimit = Number(input.limit);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), moduleQueryMaxPageSize) : 20;
  const clientIds = input.clientIds === null || input.clientIds === undefined ? null : list(input.clientIds, "clientIds");
  const statuses = list(input.statuses ?? input.status, "statuses");
  return {
    limit,
    search: text(input.search ?? input.q, "search", 80),
    wallId: text(input.wallId, "wallId", 200) || null,
    clientId: text(input.clientId, "clientId", 200) || null,
    clientIds,
    statuses,
    cursor: decodeModuleCursor(input.cursor)
  };
}

export function moduleQueryFilters(query) {
  return {
    search: query.search || null,
    wallId: query.wallId,
    clientId: query.clientId,
    statuses: query.statuses,
    limit: query.limit
  };
}

export function moduleQueryCursorPositionMax() {
  return cursorPositionMax;
}
