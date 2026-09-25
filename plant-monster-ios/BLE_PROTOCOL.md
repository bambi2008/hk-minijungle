# Plant Monster BLE Protocol V1

**Status:** frozen for the ESP32-C3 SuperMini prototype

**Wire version:** `0x01`

**Transport:** Bluetooth Low Energy

**Byte order:** little-endian

**Maximum packet size:** 20 bytes

This document is the shared contract between the iOS app and the ESP32-C3 firmware. The UUIDs and packet layout below must not be changed on only one side.

## 1. Advertising and GATT

Recommended local name: `Plant Monster <unit-name>`.

| Item | UUID | Required properties |
|---|---|---|
| Primary service | `7A3E0001-7E5B-4B7C-A1A0-6C6B504D0001` | Primary service; include in advertising |
| Telemetry | `7A3E0002-7E5B-4B7C-A1A0-6C6B504D0001` | `read`, `notify` |
| Command | `7A3E0003-7E5B-4B7C-A1A0-6C6B504D0001` | `write` with response |

The app reports the device as connected only after both characteristics are found and telemetry notifications are active. No custom MTU is required because every V1 packet fits the default 20-byte ATT payload.

## 2. Common framing

All packets begin with:

| Offset | Size | Meaning |
|---|---:|---|
| 0 | 1 | Magic `0xA5` |
| 1 | 1 | Protocol version `0x01` |
| 2 | 1 | Packet type: telemetry `0x01`, command `0x10` |

CRC uses **CRC-8/ATM**: polynomial `0x07`, initial value `0x00`, no reflection, no final XOR. It covers every byte before the CRC field. The standard test vector `123456789` must produce `0xF4`.

## 3. Telemetry packet — 20 bytes

The ESP32 sends this packet on the telemetry characteristic at connection, after a material sensor change, and immediately after handling a command.

| Offset | Size | Type | Meaning |
|---|---:|---|---|
| 0 | 1 | `u8` | Magic `0xA5` |
| 1 | 1 | `u8` | Version `0x01` |
| 2 | 1 | `u8` | Type `0x01` |
| 3 | 1 | bit field | Bit 0 touch active; bit 1 moving; bits 2–7 reserved and zero |
| 4 | 2 | `u16` | Telemetry sample sequence, wraps naturally |
| 6 | 2 | `i16` | Ambient temperature in 0.01 °C |
| 8 | 2 | `u16` | Relative air humidity in 0.01 %RH |
| 10 | 2 | `u16` | Substrate moisture in 0.01%; `0xFFFF` means unavailable |
| 12 | 4 | `u32` | Illuminance in lux |
| 16 | 1 | `u8` | Expression ID; `0` means no explicit expression |
| 17 | 1 | `u8` | Acknowledged command sequence |
| 18 | 1 | `u8` | Ack status: `0` none, `1` applied, `2` unsupported, `3` invalid payload, `4` busy |
| 19 | 1 | `u8` | CRC-8/ATM over bytes 0–18 |

Validated ranges in the app:

- temperature: −40.00…85.00 °C;
- air humidity: 0.00…100.00 %RH;
- substrate moisture: 0.00…100.00% or unavailable;
- illuminance: 0…200,000 lux.

Air humidity and substrate moisture are separate measurements. The app does not infer substrate moisture from air humidity.

## 4. Command packet — 8 bytes

The app writes this packet to the command characteristic using a write with response.

| Offset | Size | Type | Meaning |
|---|---:|---|---|
| 0 | 1 | `u8` | Magic `0xA5` |
| 1 | 1 | `u8` | Version `0x01` |
| 2 | 1 | `u8` | Type `0x10` |
| 3 | 1 | `u8` | Command sequence, 1…255, wraps to 1 |
| 4 | 1 | `u8` | Command ID: `1` identify, `2` show expression |
| 5 | 1 | `u8` | Command value; expression ID for command `2`, otherwise `0` |
| 6 | 1 | `u8` | Reserved; must be `0` |
| 7 | 1 | `u8` | CRC-8/ATM over bytes 0–6 |

### Required acknowledgement flow

1. Validate length, magic, version, packet type, reserved byte and CRC.
2. If valid and supported, apply the command.
3. Notify one telemetry packet immediately.
4. Copy the command sequence into telemetry byte 17 and set byte 18 to the result.
5. For `show expression`, telemetry byte 16 contains the expression actually shown.

The app displays “它收到了” only when an `applied` acknowledgement has the same sequence as the pending touch command. A successful GATT write or an unrelated `T02` expression is not sufficient.

## 5. Expression IDs

| ID | Existing code | Meaning |
|---:|---|---|
| 0 | — | No explicit expression |
| 1 | `G00` | Mischievous idle |
| 2 | `G02` | Comfortable light |
| 3 | `G03` | Find light |
| 4 | `G04` | Too bright |
| 5 | `G05` | Sleeping |
| 6 | `G06` | Too cold |
| 7 | `G07` | Too hot |
| 8 | `G10` | Thirsty |
| 9 | `G11` | Watered / overwatered |
| 10 | `M01` | Picked up |
| 11 | `M03` | Dizzy |
| 12 | `T01` | Wink |
| 13 | `T02` | Enjoying touch |
| 14 | `T04` | Annoyed |
| 15 | `P03` | Pollination ritual |

## 6. Timing and state rules

- Notify once immediately after the iPhone subscribes.
- Normal sensor cadence: 1–3 seconds, or sooner after a meaningful change.
- Touch and movement are current boolean states; keep an active pulse visible for at least 150 ms so it is not missed between packets.
- Command acknowledgement target: within 500 ms; the app waits 2.5 seconds before showing an unconfirmed state.
- The ESP32 may repeat the most recent acknowledgement. The app matches by sequence, so duplicates are safe.
- On reconnect, restart telemetry sample sequence at any value. Command sequence belongs to the app connection and does not need to persist in flash.

## 7. Migration compatibility

The iOS decoder temporarily accepts the old JSON telemetry object so bench firmware can migrate gradually:

```json
{"t":22.0,"rh":56,"sm":43,"lux":320,"touch":true,"moving":false,"expr":"T02"}
```

Production commands are V1 binary packets. Firmware used for TestFlight hardware testing must implement the frozen UUIDs and binary command acknowledgement above.

The matching ESP32-C3 constants and packed structs are in `FirmwareReference/ESP32C3/PlantMonsterBLEProtocolV1.h`.
