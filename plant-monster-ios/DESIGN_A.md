# Direction A — hardware companion

Selected by the user on 2026-10-12. References: Moonlitt's centred subject and restrained controls; Nothing X's device presentation. This is an original Plant Monster interface using the existing product assets.

## Visual system

- Graphite background, aubergine stage atmosphere, pale lilac controls, green reserved for the creature's OLED and active signals.
- One complete creature occupies the centre of the opening viewport. Its render slot is 82% of phone width, capped at 420pt.
- 24pt page gutters; 24pt panel corners; compact 30–34pt headings with Dynamic Type.
- State first, sensor evidence behind an expandable control. Journey, wardrobe, care and memory interactions retain their existing models and actions.
- Swipe from the opening stage into companion details and care. Care navigation still scrolls to that section.

## Layout correction

The previous background used an unconstrained scaled-to-fill image inside a root ZStack. It could enlarge the parent's reported size before content was measured. The background now measures its parent's viewport, bounds the image and clips decoration. Pairing, companion, care and memory content use explicit viewport widths. Fixed 390pt stage sizing has been removed.

## Verification

The preview build captures nine Chinese simulator states. Native UI tests check pairing title and connect-button bounds, evidence expand/collapse and touch interaction. XCTest unit tests verify existing state/protocol logic. Physical Bluetooth, motion permissions and a user-device visual review remain device checks.

Build and visual review results are recorded in VERIFICATION.md and DESIGN_A_QA.md. Final run `38164208833` passed compilation, 14 unit tests and 2 UI tests. A passing screenshot capture alone is not interaction verification.
