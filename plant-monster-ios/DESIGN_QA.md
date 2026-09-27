# Design QA

Reference: `design/plant-monster-ios-typography-refined-board-v3.png`

## Source-level review completed

- The visual system now uses one continuous interaction language across Pairing, Companion, Care, and Memories: responsive depth, restrained motion, soft material, spotlight, and short tactile feedback.
- The physical product remains the protagonist. The opening and Companion stages use one clean eight-angle turntable asset without a second OLED layer, so side and rear views cannot overlap the front display.
- Turntable rotation follows the finger continuously, changes angle at an 82pt cadence, adds restrained perspective while held, then settles to the selected angle. The one-time hint disappears after the first exploration.
- The 44pt arrow controls and VoiceOver adjustable action provide equivalent non-drag operation. Tapping a side or rear angle returns the product to the front; only a front-facing tap can send a touch interaction.
- Companion is now a scroll-linked editorial story: the hero recedes subtly as the user moves upward, the background deepens, and Care enters as the next chapter instead of appearing as a separate dashboard.
- Care presents temperature, air humidity, planting-substrate moisture, and light as swipeable sensor stories with a visible next-card edge. Accessibility text sizes fall back to a vertical stack.
- The movement sensor uses a live ripple only when movement is detected, while still preserving its binary protocol contract and readable last-detected state.
- Memories uses editorial cards and scroll transitions instead of a utility-style list; the native three-item `TabView` remains the primary navigation model.
- Type hierarchy uses SF system fonts, sentence case, restrained labels, and monospaced sensor/time data. English and Simplified Chinese carry the same 119 localization keys.
- The palette matches the approved sage, aubergine, smoked glass, bone, and OLED green system. Animated botanical light and spotlight effects respect Reduce Motion and Reduce Transparency.
- All primary controls meet or exceed 44×44 points. Content scrolls at large text sizes, and the new sensor carousel has a vertical accessibility-size alternative.
- VoiceOver labels describe visual expressions and the product image. Haptics remain purposeful and can be disabled from the device sheet.
- Air humidity and planting-substrate moisture are separate readings; missing substrate data is unavailable rather than estimated.
- Face-touch copy distinguishes demo, sending, device-confirmed, unconfirmed, and unavailable states; only a firmware `T02` response is described as received.

## Native visual QA still required

This Windows host cannot render SwiftUI or run iOS Simulator. Pixel-level layout, scroll-gesture arbitration, turntable feel, native material behavior, SF Symbol availability, and real accessibility focus order must be checked in Xcode before release. The target devices and scenarios are listed in `VERIFICATION.md`.
