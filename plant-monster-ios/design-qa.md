# Design QA

**Final result: passed**

## Comparison target

- Source visual truth: `C:\Users\ss\Documents\hk minijungle\design\plant-monster-ios-fashion-board-v1.png`
- Source pixels: 1905 × 826. The source is a five-screen design board rather than a single device capture.
- Rendered implementation: `C:\Users\ss\.codex\visualizations\2026\09\20\01a0bea1-1713-77d3-8ba8-da61f786d923\plant-monster-build23\design-comparison.png`
- Individual implementation captures: `pairing.png`, `companion.png`, `companion-touch.png`, `care.png`, and `memories.png` in the same Build 23 directory.
- Implementation pixels: 1206 × 2622 per screen.
- Viewport: iPhone 16 Pro simulator, 402 × 874 points, portrait, native @3x capture.
- Normalization: the source board was fitted to 2300 × 997 pixels and each implementation screen to 440 × 957 pixels in one 2400 × 2200 comparison canvas. Original-resolution Care and Touch captures were also reviewed as focused regions.
- States: first pairing, companion idle, confirmed touch response, care/light guidance, and today's memories.

## Full-view comparison evidence

The Build 23 comparison preserves the source board's defining system: near-black OLED canvas, very large black-weight sans-serif headlines, restrained monospaced metadata, white pixel expressions, fine hairlines, and one fluorescent green signal color. Screen hierarchy and density remain recognizably part of the same editorial system across pairing, companion, touch, care, and memories.

The main deliberate departure is the physical Plant Monster product on Pairing and Companion. The source board uses an isolated OLED face; the implementation uses the user's required full product and eight-angle direct-drag turntable. Touch changes the whole stage to the source-inspired OLED signal scene, rather than layering a second face on top of the product.

The persistent native tab bar is another intentional product adaptation. It keeps Companion, Care, and Memories reachable while preserving the black editorial treatment.

## Focused-region comparison evidence

- Touch: the original 1206 × 2622 capture shows a clearly different state from idle: the product recedes, the OLED face becomes dominant, green signal rings and glow fill the stage, the headline changes to `TOUCH RECEIVED.`, and the primary button becomes fluorescent green.
- Care: the original 1206 × 2622 capture confirms the header is clear of the status bar, the light beam and OLED face remain sharp, all four sensor dimensions are visible, and the selected light cell uses the same signal green.
- Product imagery: the supplied Plant Monster render remains sharp at native density and is not replaced by generated or code-drawn art.
- Memories: expression thumbnails, times, event copy, filters, and dividers remain legible without generic rounded cards.

## Required fidelity surfaces

- Fonts and typography: SF system black headlines and monospaced support copy match the board's editorial contrast. Headline wrapping is intentional and no text is truncated in the reviewed states.
- Spacing and layout rhythm: 20-point page margins, hairline divisions, square expression frames, and generous negative space reproduce the board's cadence. Persistent controls remain outside critical text.
- Colors and visual tokens: near-black, white, muted gray, and OLED green map directly to the source. Green is reserved for live, selected, and touch-response states.
- Image quality and asset fidelity: real product and authored OLED assets are used at native resolution; no placeholder, emoji, handcrafted SVG, or fake product art appears.
- Copy and content: Pairing, Companion, Touch, Care, and Memories use short product-specific language. `TODAY / 02` is an event count, not a fabricated streak.
- Accessibility and behavior: primary controls meet the 44-point minimum, non-drag turn buttons remain available, Reduce Motion paths exist, and sensor controls have readable labels. Physical-device VoiceOver and haptic testing remains a release test gap, not a visual mismatch.

## Comparison history

### Iteration 1 — Build 21

- [P1] The Companion footer appeared above the Care header after the automated scroll transition, intruding into the status-bar region.
  - Fix: removed the redundant Companion footer from the end of the hero and preserved the scroll cue.
- [P2] The touch QA capture used preview copy (`IT ANSWERED.`) instead of the connected confirmation copy from the selected design.
  - Fix: changed the debug-only touch state to the confirmed delivery state.

### Iteration 2 — Build 22

- The application compiled and the production build was uploaded successfully.
- [P1 QA blocker] The automated Care screenshot caught an empty navigation transition frame, so the rendered Care implementation could not be judged from that artifact.
  - Fix: made the debug-only Care capture open the same native `CareView` directly while leaving production tab routing unchanged.

### Iteration 3 — Build 23

- Post-fix evidence: all five 1206 × 2622 captures rendered successfully.
- The Care header no longer contains the previous screen's footer.
- The Touch capture now uses `TOUCH RECEIVED.` and shows a materially different full-stage response.
- No actionable P0, P1, or P2 visual differences remain.

## Residual test gaps

- Direct-drag feel, haptics, VoiceOver focus order, Bluetooth delivery, and the Companion-to-Care upward gesture still require a physical iPhone and ESP32-C3 SuperMini.
- These gaps do not block the visual-design comparison; they remain in `VERIFICATION.md` as release validation.
