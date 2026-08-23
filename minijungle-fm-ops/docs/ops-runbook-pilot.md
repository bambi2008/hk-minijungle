# DR FOREST OPS Pilot Runbook

This runbook describes the smallest controlled pilot that can be operated with the current build. It is not a production deployment guide for 1,000+ modules.

## 1. Configure The Pilot Operator

Set these environment variables before starting the server. The password is hashed with `scrypt`; it is never stored as plaintext.

```powershell
$env:DR_FOREST_OPERATOR_EMAIL = "ops@your-company.example"
$env:DR_FOREST_OPERATOR_PASSWORD = "use-a-unique-password-at-least-12-chars"
$env:DR_FOREST_OPERATOR_NAME = "Hong Kong FM Lead"
$env:DR_FOREST_OPERATOR_ROLE = "fm-lead"
$env:DR_FOREST_OPERATOR_CLIENTS = "*"
node server.mjs --port 8010
```

Without these values, the local walkthrough still uses the existing demo principals. Do not use those principals for a real client pilot.

## 2. Start And Check The Service

```powershell
npm.cmd start -- --port 8010
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8010/api/health
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8010/api/health/ready
```

`/api/health/ready` must return `status: ready`. A non-ready response stops the morning route until the database, master-data relationships, module records, mobile tables, proof vault, reminder actions and telemetry tables are checked.

## 3. Daily Field Flow

1. Open `/mobile.html` on the assigned technician device.
2. Select the assigned work order and record water, nutrient, visual health and notes.
3. Capture a plant-zone photo with people outside the frame.
4. Use `Sync visit` when online. Use `Save offline` when connectivity is unavailable.
5. Use `Sync queue` after the network returns. A visit is complete only after the queue count returns to zero.
6. FM lead reviews the proof media status and verifies the evidence before sending a client report.

The shortcut path is `/operations.html`: review `Open reminders`, choose `Start`, then the linked technician action opens the correct work order. A reminder is only closed after the mobile capture sync writes a completed reminder action.

For a module-specific visit, select the module before capture. The status strip shows the latest `temperature`, `humidity`, `co2` and `mc` readings. `-- / no data` means the device is not connected or has not reported; it is not a zero reading.

The initial module IDs and camera/device entries are generated from the existing wall module counts for the pilot UI. Before a real site goes live, replace them with actual module IDs, gateway IDs, camera IDs and calibrated thresholds through the Admin Data surface.

## 4. Device Ports

Register a real sensor, gateway or camera from the `Devices` tab in `/admin.html`. The device key is displayed only at registration or rotation time and must be provisioned into the gateway securely.

- Sensor or gateway readings: `POST /api/device-ingestion/readings`
- Camera metadata or pilot file payload: `POST /api/device-ingestion/camera-captures`
- Device mapping and status: `GET /api/devices` and `GET /api/device-health`
- Device authentication: `x-dr-forest-device-key` or `Authorization: Bearer <device-key>`

The reading port accepts `temperature`, `humidity`, `co2` and `mc`. A camera port accepts JPEG, PNG or WebP metadata, with a small local file payload supported for the pilot. Every payload needs an idempotency key so gateway retries do not create duplicate telemetry or camera records. The generated simulator rows are safe for interface testing only; they must not be reported as connected devices.

Thresholds are configured in the `Alert rules` tab. Only use calibrated values approved for the site and module type. An out-of-range reading creates an alert in `/operations.html`; repeated readings update the same alert occurrence count. Use `Acknowledge` when an owner has accepted the issue and `Resolve` only after the field action and evidence are complete.

Camera captures can be sent to the AI vision port through `POST /api/ai/visual-diagnoses`. The task remains `queued` until a real provider or worker calls the completion endpoint. A queued task is not an AI diagnosis and must not be included as a completed health conclusion.

## 5. Backup And Restore

Create a timestamped backup containing the SQLite runtime database, local proof files and a SHA-256 manifest:

```powershell
npm.cmd run backup:runtime
```

Restore only during a maintenance window after stopping the server. The command first keeps a `pre-restore-*` copy inside the runtime folder:

```powershell
npm.cmd run restore:runtime -- --backup "C:\path\to\backups\ops-runtime-..."
```

The current backup is local. A real pilot must copy it off-host and periodically perform a restore drill on a separate machine.

## 6. Honest Boundaries

- The stored health snapshot is a sensor-stability score, not a complete AI plant diagnosis.
- The evidence vault is local pilot storage, not managed cloud object storage.
- The pilot session is password-hashed and expiring, but it is not corporate SSO/MFA.
- The system must not be marketed as ready for 1,000+ modules until managed database, off-host backup, object storage, identity, monitoring and repeated multi-client operations are proven.
