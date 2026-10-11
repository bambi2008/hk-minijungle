# Verification status

## Direction A redesign — 2026-10-12

- The selected hardware-companion design replaces the oversized editorial hierarchy with a centred creature stage, graphite/lilac surfaces, rounded panels, compact headings, and consistent 24pt gutters.
- The background image is constrained to its measured viewport before clipping, addressing the root-container expansion missed by earlier width-only patches.
- Xcode simulator compilation and all 14 unit tests plus 2 UI tests passed in run `38160503708` (`fea0cbb`). The UI tests exercise evidence expand/collapse, touch, and pairing-control bounds.
- Nine original Chinese iPhone 16e simulator captures were inspected. Text and cards fit the viewport, but the creature retained obsolete per-frame left-shift compensation. The sprite alpha bounds were measured and the shared model/accessory offsets corrected in `b023350`.
- Run `38162894415` passed compilation, 14 unit tests and both UI tests. Its fresh screenshots revealed a smaller pairing-only offset: the square product composite was placed at the origin of the non-square space left by bottom controls.
- The composite is now explicitly centred within that available rectangle in `07f6304`. Final run [38164208833](https://github.com/bambi2008/hk-minijungle/actions/runs/38164208833) passed simulator compilation, all 14 unit tests and both UI tests with zero failures. It produced nine new Chinese captures; artifact `11711303353`. The final five-page review board and full-size pairing capture were inspected, confirming the final centring change and horizontal page fit on the tested iPhone 16e simulator.
- Full-size captures: `_qa/direction-a-reviewed/screens/`; overview: `_qa/direction-a-reviewed/review.png`. Review notes: `DESIGN_A_QA.md`.
- The first pairing UI test could not enter onboarding because an earlier demo launch persisted paired state. The test now overrides that launch preference and passed on rerun.
- No new TestFlight release has been made for this redesign at this point. Earlier Builds 39–42 do not contain Direction A.
- Physical BLE and Core Motion checks remain hardware validation; simulator mock telemetry and journey values are demonstration data.

## Completed

- GitHub Actions Build 22 compiled with Xcode 26, archived with App Store signing, uploaded to App Store Connect, finished processing, and was assigned to the `Plant Monster Internal` TestFlight group.
- GitHub Actions Build 23 recompiled the final source and captured Pairing, Companion idle, confirmed Touch, Care, and Memories on an iPhone 16 Pro simulator.
- The five native captures are 1206 × 2622 pixels and the visual comparison against the approved black editorial board passed. See `design-qa.md`.
- The idle and confirmed-touch captures prove a full-stage change: product visibility, OLED expression scale, green signal rings and glow, headline, body copy, and primary action all change.
- Asset catalog JSON parsed successfully. All 15 OLED expression PNGs, the real product cutout, turntable frames, and botanical background are present.
- English and Simplified Chinese currently contain matching localization-key sets; the latest static check counted 228 keys in each language.
- Air humidity and planting-substrate moisture remain distinct. Missing substrate data is displayed as unavailable rather than inferred.
- The movement sensor retains its binary protocol state, event memory, and visible last-detected message.
- BLE Protocol V1 retains the frozen service/characteristic UUIDs, telemetry and command packets, CRC-8/ATM, expression IDs, sequence matching, acknowledgement, and timeout behavior.
- Touch is only described as delivered after a matching `applied` acknowledgement. Offline and demo actions remain explicitly labelled as preview or unavailable.
- The product can be rotated through eight authored views by direct drag, arrow controls, or VoiceOver adjustable actions. Side and rear taps return to front rather than sending a face touch.

## Remaining physical-device validation

- The current anthropomorphic-state and Core Motion changes compiled on the macOS/Xcode workflow; live pedometer behavior still requires a physical iPhone.
- On a physical iPhone, tap `Start together`, verify the contextual Motion & Fitness prompt, deny/restore permission, background/foreground refresh, live step updates, distance formatting, and midnight rollover behavior.
- Confirm the step journey remains on-device and does not request Apple Health access.

- Install TestFlight Build 22 on a physical iPhone and verify horizontal turntable drag, settle cadence, arrow controls, touch-stage transition, native haptics, and upward scrolling into Care.
- Pair to the ESP32-C3 SuperMini and verify reconnect, live temperature, air humidity, planting-substrate moisture, light, touch, and motion data end to end.
- Verify valid packets, bad CRC rejection, unavailable substrate moisture, sequence wrap, duplicate acknowledgements, acknowledgement timeout, Bluetooth denied/off, device out of range, and interrupted connection.
- Run VoiceOver, accessibility Dynamic Type sizes, Reduce Motion, Simplified Chinese, and compact-iPhone layout checks on hardware.
- Unit and UI tests run in the current macOS workflow; physical-device accessibility, BLE, and pedometer validation remain separate.
