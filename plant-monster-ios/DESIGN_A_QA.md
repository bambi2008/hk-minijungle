# Direction A — native interface review

## Scope and evidence

Original Chinese iPhone 16e simulator captures of the native SwiftUI app at `07f6304`, run `38164208833`; no generated mockups. Compilation, 14 unit tests and 2 UI tests passed. The final pairing capture and five-page board were inspected after the last centring fix. Source revision and final results are recorded in VERIFICATION.md. The existing product artwork, eight-angle turntable and accessory alignment remain in use. This is not a continuous 3D mesh.

## Reviewed flow

1. Pairing (`pairing.png`): compact centred introduction, a complete product render and a clear connect action. The native UI test checks title/action horizontal bounds and action hit testing.
2. Opening stage (`companion.png`): only the creature and stage light, as requested. The sprite's visible alpha silhouette, rather than its transparent canvas, determines centring; all eight corrections apply jointly to model and accessory.
3. Companion details (`companion-narrative.png`): readable state first, expandable sensor evidence, touch action, shared steps and wardrobe. The native UI test opens/closes evidence and taps touch. Typography and panels stay within the 24pt page gutters.
4. Care (`care.png`): feelings lead the four sensor cards, with underlying temperature, air humidity, substrate moisture and light retained. A two-column layout replaces the overflowing four-column strip. Motion and record-memory actions remain below, accessible by scrolling.
5. Memories (`memories.png`): compact timeline with distinct expression thumbnails and rounded rows. Existing filtering/editing logic is retained; this pass does not provide an automated end-to-end delete test.

## Fixes made during review

- Bound and clip the root background before its scaled image can expand the containing layout.
- Replace fixed-width stage geometry with measured viewport widths.
- Replace obsolete negative frame shifts with measured alpha-bound corrections, including fractional 443.5px sprite cells.
- Centre the square product composite inside its entire available rectangle: pairing's bottom controls make that rectangle non-square.
- Preserve a shared accessory/model transform.
- Give pairing UI tests an explicit unpaired launch state, rather than inheriting persistent simulator preferences.

## Accessibility and evidence limits

- Screenshot review supports default Chinese typography and horizontal fit on the tested simulator, not full accessibility compliance or all phone sizes.
- Sensor cards use a single column at accessibility text sizes; full on-device Dynamic Type and VoiceOver review remains necessary.
- The immersive first screen intentionally omits visible controls/text. Scroll discoverability should be checked with a new user on a physical phone.
- Reduce Motion handling exists, but stage light timing, audio, haptics and live Bluetooth/pedometer behavior cannot be validated by static screenshots.
- Sensor and step values in UI-testing captures are labelled demonstration data in the review board; they are not real-device measurements.
- Successful compile and 14 unit/2 UI tests do not prove hardware protocol integration. ESP32-C3 and Motion & Fitness permission checks remain physical-device validation.

## Review artifact

`Scripts/compose-design-qa.ps1` assembles the five actual captures without replacing their UI or inventing states. Full-resolution originals remain available beside the board. No new TestFlight upload was requested for this direction-selection pass.
