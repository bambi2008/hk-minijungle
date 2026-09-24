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
{"t":22.0,"rh":56,"lux":320,"touch":true,"moving":false,"expr":"T02"}
```

| Field | Meaning | Unit |
|---|---|---|
| `t` | Ambient temperature | °C |
| `rh` | Relative air humidity | %RH |
| `lux` | Illuminance | lux |
| `touch` | Touch sensor active | boolean |
| `moving` | Motion sensor active | boolean |
| `expr` | Optional expression code | G00…P03 |

Air humidity is not soil moisture. The app never derives a watering recommendation from `rh`. `G10` (thirsty) and `G11` (watered) are shown only when the firmware explicitly reports those expressions or a future soil/watering signal is added.

## Provisional app command JSON

```json
{"command":"expression","value":"T02"}
```

The app sends `T02` after the user pets the OLED face. An optional identify command is `{"command":"identify"}`.

