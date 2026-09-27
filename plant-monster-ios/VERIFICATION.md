# Verification status

## Completed

- GitHub Actions Build 22 compiled with Xcode 26, archived with App Store signing, uploaded to App Store Connect, finished processing, and was assigned to the `Plant Monster Internal` TestFlight group.
- GitHub Actions Build 23 recompiled the final source and captured Pairing, Companion idle, confirmed Touch, Care, and Memories on an iPhone 16 Pro simulator.
- The five native captures are 1206 × 2622 pixels and the visual comparison against the approved black editorial board passed. See `design-qa.md`.
- The idle and confirmed-touch captures prove a full-stage change: product visibility, OLED expression scale, green signal rings and glow, headline, body copy, and primary action all change.
- Asset catalog JSON parsed successfully. All 15 OLED expression PNGs, the real product cutout, turntable frames, and botanical background are present.
- English and Simplified Chinese each contain 161 matching localization keys.
- Air humidity and planting-substrate moisture remain distinct. Missing substrate data is displayed as unavailable rather than inferred.
- The movement sensor retains its binary protocol state, event memory, and visible last-detected message.
- BLE Protocol V1 retains the frozen service/characteristic UUIDs, telemetry and command packets, CRC-8/ATM, expression IDs, sequence matching, acknowledgement, and timeout behavior.
- Touch is only described as delivered after a matching `applied` acknowledgement. Offline and demo actions remain explicitly labelled as preview or unavailable.
- The product can be rotated through eight authored views by direct drag, arrow controls, or VoiceOver adjustable actions. Side and rear taps return to front rather than sending a face touch.

## Remaining physical-device validation

- Install TestFlight Build 22 on a physical iPhone and verify horizontal turntable drag, settle cadence, arrow controls, touch-stage transition, native haptics, and upward scrolling into Care.
- Pair to the ESP32-C3 SuperMini and verify reconnect, live temperature, air humidity, planting-substrate moisture, light, touch, and motion data end to end.
- Verify valid packets, bad CRC rejection, unavailable substrate moisture, sequence wrap, duplicate acknowledgements, acknowledgement timeout, Bluetooth denied/off, device out of range, and interrupted connection.
- Run VoiceOver, accessibility Dynamic Type sizes, Reduce Motion, Simplified Chinese, and compact-iPhone layout checks on hardware.
- Run `PlantMonsterTests` on macOS; the current workflow compiles the app but does not execute the unit-test target.
