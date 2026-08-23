export const observabilityVersion = "2026-08-19.observability-v1";

const MAX_ROUTE_KEYS = 120;
const MAX_EVENT_KEYS = 120;
const MAX_DURATIONS = 1000;
const state = {
  startedAt: new Date().toISOString(),
  requestCount: 0,
  http5xxCount: 0,
  applicationErrorCount: 0,
  totalDurationMs: 0,
  durations: [],
  statusCounts: new Map(),
  routeCounts: new Map(),
  eventCounts: new Map(),
  errorCounts: new Map()
};

function key(value, fallback = "unknown") { return String(value || fallback).slice(0, 160); }
function increment(map, value) {
  const entry = key(value);
  const limit = map === state.routeCounts ? MAX_ROUTE_KEYS : MAX_EVENT_KEYS;
  if (!map.has(entry) && map.size >= limit) return;
  map.set(entry, (map.get(entry) || 0) + 1);
}
function sortedObject(map) { return Object.fromEntries([...map.entries()].sort(([left], [right]) => left.localeCompare(right))); }
function percentile(values, percentileValue) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.ceil((percentileValue / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

export function recordHttpRequest({ method, path, status, durationMs }) {
  const duration = Math.max(0, Number(durationMs) || 0);
  const statusCode = Number(status) || 0;
  state.requestCount += 1;
  state.http5xxCount += statusCode >= 500 ? 1 : 0;
  state.totalDurationMs += duration;
  state.durations.push(duration);
  if (state.durations.length > MAX_DURATIONS) state.durations.shift();
  increment(state.statusCounts, statusCode);
  increment(state.routeCounts, `${String(method || "GET").toUpperCase()} ${String(path || "/").split("?")[0]}`);
}

export function recordApplicationError(error) {
  state.applicationErrorCount += 1;
  increment(state.errorCounts, error?.code || error?.name || "UNHANDLED_ERROR");
}

export function recordOperationalEvent(type) {
  increment(state.eventCounts, type || "unknown-event");
}

export function observabilitySnapshot() {
  const monitoringMarker = String(process.env.DR_FOREST_MONITORING_VERIFIED || "pending").trim().toLowerCase();
  return {
    observabilityVersion,
    generatedAt: new Date().toISOString(),
    process: {
      startedAt: state.startedAt,
      uptimeSeconds: Math.round(process.uptime()),
      nodeVersion: process.version,
      pid: process.pid,
      memory: process.memoryUsage()
    },
    requests: {
      total: state.requestCount,
      http5xx: state.http5xxCount,
      applicationErrors: state.applicationErrorCount,
      averageDurationMs: state.requestCount ? Math.round(state.totalDurationMs / state.requestCount) : 0,
      p50DurationMs: percentile(state.durations, 50),
      p95DurationMs: percentile(state.durations, 95),
      byStatus: sortedObject(state.statusCounts),
      byRoute: sortedObject(state.routeCounts)
    },
    operations: {
      byEvent: sortedObject(state.eventCounts),
      byErrorCode: sortedObject(state.errorCounts)
    },
    delivery: {
      logFormat: "json-stdout",
      logSink: String(process.env.DR_FOREST_LOG_SINK || "stdout").trim(),
      alertWebhookConfigured: Boolean(String(process.env.DR_FOREST_ALERT_WEBHOOK_URL || process.env.DR_FOREST_MONITORING_ALERT_WEBHOOK || "").trim()),
      monitoringEvidenceMarker: monitoringMarker,
      monitoringEvidenceStatus: monitoringMarker === "verified" ? "marked-verified" : "missing"
    },
    limits: {
      routeCardinalityLimit: MAX_ROUTE_KEYS,
      eventCardinalityLimit: MAX_EVENT_KEYS,
      durationSampleLimit: MAX_DURATIONS
    }
  };
}
