# DR FOREST OPS Three-Device Internal Pilot

## Purpose / 目的

This is the smallest internal test scope before customer onboarding. It covers three real devices registered by an administrator. It is not a production-scale or customer-data approval.

这是正式接客户前的最小内部测试范围，只覆盖由管理员登记的三台真实设备，不代表千台规模生产或客户数据上线许可。

## Roles / 角色

- `Platform Admin` or `FM Lead`: add and edit device master data, bind devices to assets/modules, save physical service profiles, rotate device keys and configure thresholds.
- `Field Technician`: use the mobile route, submit maintenance evidence and report device faults; cannot add or edit devices.
- `Client Viewer`: read-only access only.

## Administrator Setup / 管理员登记

1. Open `/admin.html` and sign in with a configured administrator account.
2. Open `Devices` and choose `Register device`.
3. Enter the real `Device ID`, `Asset ID`, `Module ID`, device type, label, protocol and endpoint URL.
4. Enter the physical service profile in the same form when available: serial number, manufacturer, model, calibration interval, warranty expiry and service note.
5. Save the device. The device key is displayed only at registration or rotation time; provision it into the gateway securely and do not store it in Airtable or source control.
6. Configure calibrated alert rules for temperature, humidity, CO2 and MC in `Alert rules`.

An administrator may register the device record first and add the physical service profile later. The three-device pilot does not wait for real hardware data before the admin workflow is considered implemented.

## Device Test / 设备测试

For each of the three registered devices:

1. Send authenticated readings to `POST /api/device-ingestion/readings`.
2. Include `temperature`, `humidity`, `co2` and `mc` with the device timestamp and an idempotency key.
3. Send at least one camera capture to `POST /api/device-ingestion/camera-captures`.
4. Confirm the device appears in `GET /api/devices` and the latest readings appear in the operations view.
5. Repeat one request with the same idempotency key and confirm that no duplicate telemetry or capture is created.

Device authentication uses `x-dr-forest-device-key` or `Authorization: Bearer <device-key>`.

## Technician Test / 技师测试

1. Open `/mobile.html` on the assigned phone.
2. Select the assigned module and work order.
3. Record water, nutrient, visual condition, notes and a photo.
4. Test both online sync and one offline queue/retry cycle.
5. Record a calibration or fault event when applicable, then confirm the admin can review the audit trail.

## Exit Criteria / 通过标准

- 3/3 real device records are created by an administrator.
- 3/3 devices send authenticated readings for all four metrics.
- 3/3 devices have a camera capture or an explicitly recorded camera-unavailable exception.
- One threshold alert is acknowledged and resolved with evidence.
- One technician visit is synced successfully, including an offline retry test.
- Replayed requests remain idempotent.
- The local backup and restore check passes.

## Boundary / 边界

This pilot uses the current isolated staging deployment, SQLite and local proof storage. It does not prove TencentDB PostgreSQL, COS, off-host restore, enterprise SSO/MFA, signed production gateways or repeated customer operations. The official production operations score remains **65%** until those external gates are evidenced.
