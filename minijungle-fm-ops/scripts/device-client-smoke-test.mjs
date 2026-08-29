import { createHash, createHmac } from "node:crypto";
import { signDeviceRequest } from "../lib/ops-device-client.mjs";

function assert(condition, message) { if (!condition) throw new Error(message); }
const body = JSON.stringify({ metric: "temperature", value: 23.4 });
const headers = signDeviceRequest({ deviceId: "device-1", deviceKey: "secret-key", method: "POST", path: "/api/device-ingestion/readings", body, timestamp: 1_700_000_000_000, nonce: "nonce-1" });
const expected = createHmac("sha256", "secret-key").update(`1700000000000.nonce-1.POST./api/device-ingestion/readings.${createHash("sha256").update(body).digest("hex")}`).digest("hex");
assert(headers["x-dr-forest-signature"] === expected, "Device client signature does not match the server canonical contract");
assert(headers["x-dr-forest-device-key"] === "secret-key" && headers["x-dr-forest-device-id"] === "device-1", "Device authentication headers are incomplete");
console.log(JSON.stringify({ ok: true, signature: "verified", canonicalPath: "/api/device-ingestion/readings", noNetworkCall: true }, null, 2));
