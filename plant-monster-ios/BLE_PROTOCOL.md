# Plant Monster BLE handoff

The app already owns scanning, connection, service discovery, notifications, command writes, connection UI, and a simulator mock. The firmware team only needs to freeze the three UUIDs in `PlantMonster/Bluetooth/PlantMonsterBLEProfile.swift` and confirm the packet contract below.

## Advertising

- Recommended local name: `Plant Monster <unit-name>`
- Transport: Bluetooth Low Energy
- Target board: ESP32-C3 SuperMini

## Required GATT values

1. One primary Plant Monster service UUID.
2. One telemetry characteristic with `notify`.
3. One command characteristic with `write` or `write without response`.

## Provisional telemetry JSON

```json
{"t":22.0,"rh":56,"sm":43,"lux":320,"touch":true,"moving":false,"expr":"T02"}
```

| Field | Meaning | Unit |
|---|---|---|
| `t` | Ambient temperature | °C |
| `rh` | Relative air humidity | %RH |
| `sm` | Planting substrate moisture | % (0–100, calibrated) |
| `lux` | Illuminance | lux |
| `touch` | Touch sensor active | boolean |
| `moving` | Motion sensor active | boolean |
| `expr` | Optional expression code | G00…P03 |

Air humidity is not substrate moisture. The app never derives a watering recommendation from `rh`. During the firmware transition, `sm` is optional and the app displays an em dash when it is absent. `G10` (thirsty) and `G11` (watered) are shown only when the firmware explicitly reports those expressions or a calibrated substrate-moisture rule is agreed.

`moving` is the minimum motion contract. The app shows the current state and the most recent rising-edge time; no acceleration magnitude is invented when the sensor only reports a boolean.

## Provisional app command JSON

```json
{"command":"expression","value":"T02"}
```

The app sends `T02` after the user pets the OLED face. An optional identify command is `{"command":"identify"}`.

To let the app truthfully say “Plant Monster received it”, firmware must apply the command and then notify telemetry with `"expr":"T02"`. A successful BLE write without that response is shown as “sent, waiting for a response”, not as received.
