# Design QA

The current visual truth is `design/plant-monster-ios-fashion-board-v1.png`: a black OLED editorial system with fluorescent green used only for live signals and active response.

Build 23 was compiled and rendered on an iPhone 16 Pro simulator. Pairing, Companion idle, confirmed Touch, Care, and Memories were captured at 1206 × 2622 pixels and compared together with the source board. The detailed evidence and iteration history are in `design-qa.md`; its final result is `passed`.

The physical Plant Monster and direct-drag eight-angle turntable intentionally replace the isolated face on the Pairing and Companion boards. Touch then changes the whole stage into the OLED signal treatment, so the response is visually unmistakable and no second display is superimposed over side or rear product views.

English and Simplified Chinese contain the same 161 localization keys. Native controls preserve 44-point alternatives, Dynamic Type fallbacks, Reduce Motion behavior, and VoiceOver labels. Physical-iPhone gesture, haptic, accessibility, and BLE checks remain listed in `VERIFICATION.md`.
