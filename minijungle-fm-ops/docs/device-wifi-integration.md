# WiFi device integration contract

This is the pre-site-installation contract for the three real devices. It keeps the OPS side ready without pretending that a vendor's WiFi network, cloud API or MQTT broker is already connected.

## Operating model

- The sensor joins the customer's WiFi network and sends data outbound over HTTPS.
- OPS does not store the customer's WiFi SSID or password, and it does not need inbound access to the customer's LAN.
- Each physical device is registered by a Platform Admin or FM Lead against one client, asset and module.
- The device registry stores `transport: "wifi"`, the delivery protocol, reporting/heartbeat intervals, payload schema and the OPS ingestion contract.
- If a vendor only exposes MQTT, use a vendor cloud adapter or an edge gateway to transform MQTT messages into the signed HTTPS contract. `mqttTopic` is retained as mapping metadata; an MQTT broker/consumer is not claimed as deployed.

## Admin registration shape

`POST /api/admin/devices` accepts the existing device fields plus:

```json
{
  "connection": {
    "transport": "wifi",
    "reportingIntervalSeconds": 300,
    "heartbeatIntervalSeconds": 900,
    "payloadSchema": "dr-forest-v1",
    "mqttTopic": null
  }
}
```

Allowed payload schemas are `dr-forest-v1`, `vendor-native` and `camera-capture-v1`. TLS is enforced for physical device profiles. WiFi credentials, access tokens and private keys must stay in the vendor gateway or a managed secret store; they are intentionally not accepted as a persisted OPS connection profile.

## Telemetry endpoint

The vendor adapter or gateway publishes to:

- readings: `POST /api/device-ingestion/readings`
- camera images or capture metadata: `POST /api/device-ingestion/camera-captures`

Production requests use the registered device key with `x-dr-forest-device-id`, timestamp, nonce and HMAC signature. The request body is JSON and must include an idempotency key. A reading example:

```json
{
  "id": "READ-MJ-HK-021-M01-TEMP-2026-09-05T10:00:00Z",
  "idempotencyKey": "MJ-HK-021-M01-TEMP-2026-09-05T10:00:00Z",
  "moduleId": "MJ-HK-021-M01",
  "metric": "temperature",
  "value": 23.4,
  "unit": "C",
  "observedAt": "2026-09-05T10:00:00Z"
}
```

The same contract covers `humidity`, `co2` and `mc`; the registered device type and module scope are checked before the reading is accepted. Duplicate idempotency keys are ignored safely. Accepted readings update device last-seen/last-ingested timestamps and feed telemetry alerts and health/ESG evidence.

## Three-device acceptance sequence

1. Admin enters the real device IDs, physical serials, module mapping, WiFi transport, vendor protocol and endpoint/topic metadata.
2. The installer connects each sensor/camera to the customer's WiFi and confirms outbound DNS, HTTPS/TLS and clock synchronization.
3. The vendor adapter or gateway sends one signed reading for temperature, humidity, CO2 and MC, plus one signed camera capture where available.
4. OPS verifies the returned module scope, unit, timestamp, idempotency replay and alert behavior.
5. FM records the installation and independent verification before the device is marked active.

The code and admin UI are ready for this sequence. Real device connectivity, vendor credentials, customer WiFi access and field evidence remain external acceptance items and do not increase the production readiness score until completed.
