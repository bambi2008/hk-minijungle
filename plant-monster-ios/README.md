# Plant Monster for iPhone

Native SwiftUI prototype for 植灵兽 / Plant Monster. It turns an ESP32-C3 SuperMini device into a calm digital companion rather than a sensor dashboard.

## Included

- Pairing experience that requests Bluetooth only after a user action.
- Product-first entry and companion screens with an eight-angle, drag-controlled Plant Monster turntable and accessible arrow controls.
- Companion home with the real 15-expression OLED asset set and a tactile pet response.
- Care view for temperature, relative air humidity, planting-substrate moisture, light, and motion state.
- Memories view for touch, light, and motion moments.
- English and Simplified Chinese localization.
- CoreBluetooth implementation plus a simulator mock.
- Dynamic Type, VoiceOver labels, 44-point touch targets, Reduce Motion handling, and optional haptics.
- Privacy manifest with no tracking or data collection.

## Open on a Mac

Requirements: Xcode 16 or newer, iOS 17 SDK, and XcodeGen.

```sh
cd plant-monster-ios
xcodegen generate
open PlantMonster.xcodeproj
```

The iOS Simulator automatically uses mock telemetry. A physical iPhone uses CoreBluetooth.

## Connect the ESP32-C3 firmware

1. Implement the frozen UUIDs and packet contract in `BLE_PROTOCOL.md`.
2. Reuse the constants, packet structs, and CRC helper in `FirmwareReference/ESP32C3/PlantMonsterBLEProtocolV1.h`.
3. Advertise the Plant Monster service UUID and enable `read` + `notify` on telemetry and `write` on commands.
4. Run on a physical iPhone and validate pairing, reconnect, notification cadence, CRC rejection, and command acknowledgement.

The V1 wire format stays within the default 20-byte BLE payload. The app only reports a complete connection after the service, both characteristics, and telemetry notifications are ready.

## TestFlight

The repository includes a macOS 26 / Xcode 26 GitHub Actions workflow for unsigned compilation and authenticated TestFlight upload. Complete the one-time Apple and GitHub secret setup in `TESTFLIGHT_SETUP.md`, then run the workflow manually.

## Product truth

- `rh` is relative **air humidity**, never substrate moisture; `sm` is the separate substrate-moisture reading.
- The app does not infer watering needs from air humidity.
- Thresholds in `AppModel` are provisional UI behavior and must be tuned against the final plant, enclosure, and calibrated sensors.

## Current validation boundary

The app is compiled and distributed by the repository's macOS/Xcode workflow. Physical ESP32-C3 interoperability remains a hardware release gate; see `VERIFICATION.md`.
