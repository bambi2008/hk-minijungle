# Verification status

## Completed on this host

- Asset catalog JSON parsed successfully.
- `Info.plist` and `PrivacyInfo.xcprivacy` parsed as XML.
- All 15 authoritative OLED expression PNGs are present.
- Product cutout and botanical background are present.
- Every `PlantExpression.assetName` maps to an image set.
- Localization keys were compared between English and Simplified Chinese.
- Code review checked that air humidity is not treated as substrate moisture and that older packets remain decodable when `sm` is absent.
- BLE Protocol V1 freezes the service and characteristic UUIDs, 20-byte telemetry packet, 8-byte command packet, CRC-8/ATM, expression IDs, and command acknowledgement flow.
- Touch delivery is only confirmed after an `applied` acknowledgement matches the pending command sequence; a GATT write or unrelated expression does not count as confirmation.
- GitHub Actions has compiled and signed prior TestFlight builds with Xcode 26.

## Required on macOS before calling the build release-ready

- Generate the Xcode project and compile with warnings treated as errors.
- Run `PlantMonsterTests`.
- Exercise pairing and reconnect on a physical iPhone with the ESP32-C3 SuperMini.
- Flash firmware using `FirmwareReference/ESP32C3/PlantMonsterBLEProtocolV1.h` and verify the frozen V1 UUIDs and packets end to end.
- Verify valid packets, bad CRC rejection, unavailable substrate moisture, command sequence wrap, duplicate acknowledgements, and acknowledgement timeout.
- Run VoiceOver, Dynamic Type (including accessibility sizes), Reduce Motion, light/dark appearance, and Simplified Chinese checks.
- Visually compare Pairing, Companion, Touch, Care, and Memories against the approved V3 design board on at least one 6.1-inch and one compact iPhone.
- Test Bluetooth denied, Bluetooth off, device out of range, and interrupted connection states.
- Run the GitHub Actions compile job and `PlantMonsterTests`; resolve all Xcode 26 diagnostics.
- Complete the signed archive/upload job after the Apple Team ID and App Store Connect API secrets are configured.
