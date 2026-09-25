# Verification status

## Completed on this host

- Asset catalog JSON parsed successfully.
- `Info.plist` and `PrivacyInfo.xcprivacy` parsed as XML.
- All 15 authoritative OLED expression PNGs are present.
- Product cutout and botanical background are present.
- Every `PlantExpression.assetName` maps to an image set.
- Localization keys were compared between English and Simplified Chinese.
- Code review checked that air humidity is not treated as substrate moisture and that older packets remain decodable when `sm` is absent.
- Touch delivery is only confirmed after the firmware echoes the `T02` expression; a BLE write without reply remains visibly unconfirmed.

## Required on macOS before calling the build release-ready

- Generate the Xcode project and compile with warnings treated as errors.
- Run `PlantMonsterTests`.
- Exercise pairing and reconnect on a physical iPhone with the ESP32-C3 SuperMini.
- Verify telemetry notifications and expression commands against frozen firmware UUIDs.
- Run VoiceOver, Dynamic Type (including accessibility sizes), Reduce Motion, light/dark appearance, and Simplified Chinese checks.
- Visually compare Pairing, Companion, Touch, Care, and Memories against the approved V3 design board on at least one 6.1-inch and one compact iPhone.
- Test Bluetooth denied, Bluetooth off, device out of range, and interrupted connection states.
- Run the GitHub Actions unsigned compile job and resolve all Xcode 26 diagnostics.
- Complete the signed archive/upload job after the Apple Team ID and App Store Connect API secrets are configured.
