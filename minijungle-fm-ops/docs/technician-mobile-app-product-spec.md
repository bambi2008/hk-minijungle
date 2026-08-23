# DR FOREST Technician Mobile App

Status: pilot implementation specification  
Product: DR FOREST OPS, independent sibling app to FiveCrop/FiveApp  
Primary user: field technician servicing rented indoor planting modules in Hong Kong FM sites

## 1. Product Job

The technician must complete the next service action with the fewest possible decisions:

1. Open the assigned route.
2. See the highest-priority reminder.
3. Start the related work order.
4. Select the planting module when the task is module-specific.
5. Review available device readings, add water/nutrient, take a proof photo and record an exception if needed.
6. Submit once. If offline, save locally and retry automatically.

The app is an execution surface, not a reporting dashboard. It should never require a technician to understand ESG, portfolio analytics or investor metrics.

## 2. Design Rules

- One primary action per screen state.
- Show only today&apos;s work first.
- Keep the work-order and module context visible while capturing.
- Use a large camera control and numeric inputs; avoid long forms.
- Use status labels `Ready`, `Needs setup`, `Watch`, `Alert`, `Offline`.
- Never hide a failed sync. Keep the record in the offline queue and show the retry count.
- Device readings are read-only for the technician in v1. Manual override is a later controlled feature.
- All writes create an attributable audit event on the server.

## 3. Screens

### A. Today / Priority Reminders

Required content:

- Open reminders sorted by priority and due time.
- Reminder title, reason, due time and one action button.
- Action types:
  - `visit-record`: start a standard service visit.
  - `record-exception`: inspect and capture photo/note.
  - `inspect-sensor`: inspect the module devices and attach a photo.
- Tapping the action opens the route stop and acknowledges the reminder.

### B. Route

Each stop shows:

- client name;
- asset/wall name and location;
- work order ID, due time and priority;
- module count;
- active incident or sensor-alert count.

The route list must not require a map in v1. Navigation can be added after the field pilot confirms the service sequence.

### C. Visit Capture

Fields, in this order:

1. Module selector: whole wall or one module.
2. Device status strip: temperature, humidity, CO2 and MC.
3. Water added in litres.
4. Nutrient added in millilitres.
5. Visual health score from 0 to 100.
6. Short visit note.
7. Camera/photo capture.
8. `Save offline` and `Sync visit`.

When a module is selected, the app displays the latest readings and their status. A missing reading is shown as `-- / no data`, never as zero.

### D. Offline Queue

- Store the full visit payload and compressed photo locally.
- Show count of pending records, retry count and the last sync error.
- Retry on app open, browser `online` event and manual `Sync queue`. A failed item remains in the queue with its error and attempt count; it is never silently discarded.
- Use `batch.id` as the idempotency key. The photo evidence ID is derived deterministically from the same batch ID, so a retry after a partial upload reuses the original evidence intent instead of creating a second media record.
- A duplicate server response must not create a second batch or audit event.

## 4. Module and Device Model

Every planting module has one master record and a device map. The pilot database supports these four metrics:

| Metric | API key | Typical unit | Source |
| --- | --- | --- | --- |
| Temperature | `temperature` | `C` | module sensor |
| Relative humidity | `humidity` | `%` | module sensor |
| Carbon dioxide | `co2` | `ppm` | module sensor |
| Nutrient concentration / MC | `mc` | configured site unit | module sensor |

Each module may also have a camera device. Camera output is stored as proof media with `moduleId`, `wallId`, `workorderId`, capture batch and SHA-256 metadata.

Important pilot boundary: generated module records only derive IDs from the existing wall module count. They do not claim that hardware is installed. Real device IDs, calibration data and gateway credentials must replace the generated `not_connected` device map before production deployment.

## 5. API Contract

### Read route and reminders

```http
GET /api/mobile/route
GET /api/mobile/reminders
GET /api/modules?wallId={wallId}
```

`GET /api/mobile/reminders` returns:

```json
{
  "items": [
    {
      "id": "reminder:workorder:WO-001",
      "sourceType": "workorder",
      "clientId": "client-001",
      "wallId": "wall-001",
      "workorderId": "WO-001",
      "status": "open",
      "mobileAction": {
        "actionType": "visit-record",
        "path": "/mobile.html?workOrderId=WO-001&wallId=wall-001",
        "requiredCaptureTypes": ["photo", "water", "nutrient", "health-check"]
      }
    }
  ],
  "counts": { "open": 1, "completed": 0, "total": 1 }
}
```

### Field visit sync

```http
POST /api/mobile/capture-batches
POST /api/proof/media-intents
POST /api/proof/media-evidence/{mediaId}/upload
POST /api/mobile/reminder-actions
```

The capture batch carries `clientId`, `wallId`, `moduleId` (nullable), `workorderId`, `technicianId`, `capturedAt`, and typed items. The photo intent carries the same module context. The reminder action writes `acknowledged` or `completed` status and links the capture batch.

### Device ingestion

```http
POST /api/telemetry/sensor-readings
GET /api/telemetry/sensor-history/{wallId}?moduleId={moduleId}
```

Example reading:

```json
{
  "id": "READ-20260817-001",
  "sensorId": "WALL-001-M01-TEMP",
  "wallId": "WALL-001",
  "moduleId": "WALL-001-M01",
  "metric": "temperature",
  "type": "temperature",
  "value": 24.5,
  "unit": "C",
  "status": "ok",
  "observedAt": "2026-08-17T09:00:00.000Z",
  "source": "module-gateway"
}
```

The server rejects an unknown module for the selected wall and de-duplicates on `sensorId + observedAt`.

### Device registry and external ports

```http
GET  /api/devices?wallId={wallId}&moduleId={moduleId}
POST /api/admin/devices
PUT  /api/admin/devices/{deviceId}
GET  /api/device-health
POST /api/device-ingestion/readings
POST /api/device-ingestion/camera-captures
GET  /api/device-ingestion/camera-captures?moduleId={moduleId}
GET  /api/device-ingestion/camera-captures/{captureId}/file
```

Device data ports use `x-dr-forest-device-key` or `Authorization: Bearer {deviceKey}` and must send `Content-Type: application/json`. The key is hashed in the registry and is returned only when a device is first registered or its key is rotated. A sensor device can publish only its own metric; a gateway device can publish the four configured metrics for its registered wall/module scope. Reading batches default to a maximum of 100 records, and the service returns explicit 415/413/400 errors for content-type, body-size or batch-size violations.

The camera port accepts a metadata-only event with an `objectKey` or `imageUrl`, or a small pilot image payload through `fileBase64`. The platform verifies byte size and SHA-256 when bytes are supplied, stores them in the local pilot vault, and keeps the capture linked to `clientId`, `wallId`, `moduleId`, optional `workorderId` and device ID. Production should replace local bytes with signed cloud object storage.

Every device event carries an idempotency key. Accepted, duplicate and rejected attempts are kept in `device_ingestion_log`, so an MQTT/HTTP adapter can safely retry without duplicating business data.

### Alert and AI vision contracts

```http
GET  /api/telemetry/alert-rules?wallId={wallId}&moduleId={moduleId}
POST /api/admin/telemetry/alert-rules
GET  /api/telemetry/alerts?statuses=open,acknowledged
PUT  /api/telemetry/alerts/{alertId}
POST /api/ai/visual-diagnoses
GET  /api/ai/visual-diagnoses?statuses=queued,running
PUT  /api/ai/visual-diagnoses/{diagnosisId}
```

Alert rules are calibrated thresholds, not hard-coded horticulture assumptions. A reading outside an enabled rule creates one open alert and repeated readings update its occurrence count; it does not create an unbounded alert storm. FM staff can acknowledge or resolve the alert from `/operations.html`.

An AI visual diagnosis request is linked to a stored camera capture and starts as `queued`. A worker or external provider may move it through `running` to `completed` or `failed`. Until a provider callback writes a result, the platform must display the task as pending and must not claim that a plant diagnosis has happened.

## 6. Permissions and Scope

- `field-tech`: read assigned route, reminders, modules and telemetry; write capture batches, proof media and reminder actions.
- `fm-lead`: all field permissions plus master data and operational review.
- `client-viewer` and `esg-auditor`: read-only evidence and telemetry; no field writes.
- Every mobile write must pass client, wall, work order and optional module scope checks.

## 7. Acceptance Criteria

- A technician can start a visit from a reminder in one tap.
- A module-specific photo is linked to the correct module, wall and work order.
- A device reading shows its real status and last-seen time; missing data is explicit.
- A visit submitted offline appears in the queue and syncs after connectivity returns.
- Queue retries use the capture's stored reminder action and telemetry snapshot, not whichever work order is currently open on the phone.
- The field Service Worker caches only static application files. It does not cache API responses or intercept non-GET requests, preventing stale tenant data and accidental POST caching.
- Replaying the same batch does not duplicate records or audit events.
- Completing a visit marks the linked reminder completed in SQLite.
- A field technician cannot submit against another client or another wall&apos;s module.
- The primary mobile page remains usable at 360px width without horizontal scrolling.
- Operations staff can see open reminders, route stops, module count and device gaps from `/operations.html`.
- Operations staff can see active sensor alerts and queued AI vision tasks from `/operations.html`.
- A repeated out-of-range reading updates one alert occurrence count and can be acknowledged and resolved without creating duplicates.

## 8. Explicit Non-goals for v1

- Native iOS/Android packaging.
- Background GPS tracking.
- Automatic plant-health diagnosis from the phone camera.
- Direct control of pumps or nutrient dosing.
- A built-in AI model or automatic treatment recommendation; the current AI surface is an auditable provider port.
- Production push notifications.
- Final sensor thresholds without site calibration.
- Replacing FiveCrop/FiveApp or sharing its codebase.

## 9. Production Handoff Checklist

- Replace demo principal with production SSO/session identity.
- Register real module IDs, device IDs, camera IDs and calibration metadata.
- Connect a managed time-series ingestion path with device authentication.
- Move proof bytes from the local vault to managed object storage with malware scanning and retention policy.
- Test offline conflict recovery on at least two technician devices.
- Run a repeated multi-client pilot and reconcile module, sensor, photo and work-order counts daily.
