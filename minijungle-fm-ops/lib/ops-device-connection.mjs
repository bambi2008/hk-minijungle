export const deviceTransports = ["wifi", "ethernet", "cellular", "simulator", "manual"];
export const devicePayloadSchemas = ["dr-forest-v1", "vendor-native", "camera-capture-v1"];

function text(value) { return String(value ?? "").trim(); }
function connectionError(message) { const result = new Error(message); result.code = "DEVICE_CONNECTION_VALIDATION_ERROR"; result.status = 400; return result; }
function integer(value, fallback, minimum, maximum) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.round(parsed)));
}

export function normalizeDeviceConnection({ protocol = "http-push", config = {}, connection = null } = {}) {
  const stored = config && typeof config.connection === "object" ? config.connection : {};
  const input = connection && typeof connection === "object" ? connection : {};
  const selectedProtocol = text(protocol).toLowerCase() || "http-push";
  const defaultTransport = selectedProtocol === "simulator" ? "simulator" : "wifi";
  const storedTransport = text(stored.transport).toLowerCase();
  const transport = text(input.transport || (storedTransport === "simulator" && selectedProtocol !== "simulator" ? defaultTransport : storedTransport) || defaultTransport).toLowerCase();
  const payloadSchema = text(input.payloadSchema || stored.payloadSchema || (selectedProtocol === "camera-http" ? "camera-capture-v1" : "dr-forest-v1")).toLowerCase();
  return {
    transport: deviceTransports.includes(transport) ? transport : defaultTransport,
    reportingIntervalSeconds: integer(input.reportingIntervalSeconds ?? stored.reportingIntervalSeconds, 300, 5, 86400),
    heartbeatIntervalSeconds: integer(input.heartbeatIntervalSeconds ?? stored.heartbeatIntervalSeconds, 900, 10, 86400),
    payloadSchema: devicePayloadSchemas.includes(payloadSchema) ? payloadSchema : "dr-forest-v1",
    mqttTopic: text(input.mqttTopic || stored.mqttTopic) || null,
    tlsRequired: input.tlsRequired === undefined ? stored.tlsRequired !== false : Boolean(input.tlsRequired),
    ingestionContract: selectedProtocol === "camera-http" ? "/api/device-ingestion/camera-captures" : "/api/device-ingestion/readings"
  };
}

export function validateDeviceConnection(connection, { protocol = "http-push" } = {}) {
  if (!deviceTransports.includes(connection.transport)) throw connectionError(`device.connection.transport must be one of ${deviceTransports.join(", ")}`);
  if (!devicePayloadSchemas.includes(connection.payloadSchema)) throw connectionError(`device.connection.payloadSchema must be one of ${devicePayloadSchemas.join(", ")}`);
  if (protocol === "simulator" && connection.transport !== "simulator") throw connectionError("simulator devices must use simulator transport");
  if (protocol !== "simulator" && connection.transport === "simulator") throw connectionError("physical devices cannot use simulator transport");
  if (connection.tlsRequired !== true) throw connectionError("device.connection.tlsRequired must remain enabled");
  return connection;
}

export function normalizeDeviceConfig(config = {}, { protocol = "http-push", connection = null } = {}) {
  const base = config && typeof config === "object" ? { ...config } : {};
  base.connection = normalizeDeviceConnection({ protocol, config: base, connection });
  return base;
}
