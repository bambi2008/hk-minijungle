# Device calibration, fault and replacement control

## Purpose

This control closes the operating gap between a registered data endpoint and a physical sensor, camera or gateway that FM can trust. It covers temperature, humidity, CO2, MC, camera and gateway devices without claiming that a pilot simulator is real hardware.

## Shortest operating paths

FM Lead:

1. Open **Ops Today > Device service control**.
2. Create the physical service profile: serial, maker/model and calibration interval.
3. Act only on exceptions: calibration due, fault, quarantine, return to service, replacement or retirement.

Field Technician:

1. Open an assigned stop and select the module.
2. In **Device care**, select the device.
3. Record calibration with an evidence reference, or report a fault with a note. The request must carry a work order previously assigned to that technician.

## Controls

- Physical serial numbers are globally unique.
- Every mutation requires an `Idempotency-Key` and lifecycle `expectedUpdatedAt` version.
- Calibration requires an evidence reference and calculates the next due date from the approved interval.
- Fault/quarantine updates the ingestion registry to `offline`; FM return-to-service restores it to `active`.
- Replacement must match client, wall, module and device type. The prior record remains immutable and terminal.
- Technicians cannot quarantine, restore, replace or retire equipment.
- Technician access is limited to a module with a non-cancelled work-order assignment to that principal, including controlled after-visit completion entry.
- Client and ESG viewer roles cannot access internal equipment service controls.

## Persistence and API

- SQLite migration: `2026-09-04.device-lifecycle-v1`
- PostgreSQL migration: `2026-09-04.postgres-device-lifecycle-v1`
- Deployment SQL: `infra/postgres/013_device_lifecycle.sql`
- Tables: `ops_device_lifecycle`, `ops_device_lifecycle_events`
- `GET /api/device-lifecycle`
- `PUT /api/device-lifecycle/:deviceId/profile`
- `POST /api/device-lifecycle/:deviceId/actions`
- `GET /api/device-lifecycle/:deviceId/events`

## Evidence boundary

A stored profile or calibration record is an operational control, not a calibration certificate. Production evidence still requires real device serials, approved reference instruments, certificate/capture retention, signed identities, managed PostgreSQL, off-host recovery and repeated field cycles.
