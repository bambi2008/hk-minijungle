# Design QA

Reference: `design/plant-monster-ios-typography-refined-board-v3.png`

## Source-level review completed

- Pairing is the only place where the full physical product is the hero.
- Companion and Care use the OLED face as the digital personality.
- Touch is a temporary emotional state inside Companion, not an extra navigation destination.
- Primary navigation uses the native three-item `TabView`.
- Type hierarchy uses SF system fonts, sentence case, restrained labels, and monospaced sensor/time data.
- The palette matches the approved sage, aubergine, smoked glass, bone, and OLED green system.
- All primary controls meet or exceed 44×44 points.
- Content scrolls at large text sizes; no fixed clipping frames are used for copy.
- VoiceOver labels describe visual expressions and the product image.
- Touch motion respects Reduce Motion; haptics can be disabled in the device sheet.
- English and Simplified Chinese carry the same 70 localization keys.
- Air humidity and planting-substrate moisture are shown as separate readings; missing substrate data is shown as unavailable rather than estimated.
- Motion is expressed as a current, human-readable state plus the last detected movement, while preserving the binary sensor contract.
- Face-touch copy distinguishes demo, sending, device-confirmed, unconfirmed, and unavailable states; only a firmware `T02` response is described as received.
- The opening and companion screens use an eight-angle product turntable: direct drag, 44pt arrow alternatives, VoiceOver adjustable actions, optional cardinal-angle haptics, and Reduce Motion support.

## Native visual QA still required

This Windows host cannot render SwiftUI or run iOS Simulator. Pixel-level layout, truncation, native material behavior, SF Symbol availability, and real accessibility focus order must be checked in Xcode before release. The target devices and scenarios are listed in `VERIFICATION.md`.
