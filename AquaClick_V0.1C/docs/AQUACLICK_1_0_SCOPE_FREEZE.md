# AquaClick 1.0 Scope Freeze

## Core Decision

AquaClick 1.0 will focus on one product breakthrough:

> A circuit-free, fully removable food-contact path that can be washed or replaced as a cassette.

Other ideas are simplified, postponed, or kept only as interface reservations.

## Why This Is The 1.0 Bet

The validated customer pain is not "I need another smart feeder app." The pain is residue, smell, hidden crumbs, mold concern, hard-to-clean dispensing mechanisms, and fear of damaging electronics while cleaning.

Competitors already cover many table-stakes features: scheduled feeding, app control, battery backup, camera variants, RFID variants, and basic removable bowls or hoppers. AquaClick should not compete by adding more generic smart features first.

The sharper 1.0 claim is:

> The dirty food path comes out. The electronics stay dry.

## V1 Value Proposition

For cat owners who rely on automatic feeding but hate cleaning hidden food residue, AquaClick is a dry-food automatic feeder with a passive removable food cassette, so the entire food-contact route can be removed, rinsed, soaked, dried, or replaced without exposing the motor, PCB, battery, camera, or wiring.

## V1 Must Do

| ID | Capability | Reason |
|---|---|---|
| V1-MUST-01 | Removable food cassette | This is the core product promise |
| V1-MUST-02 | Food-contact cassette contains no circuit, motor, battery, camera, speaker, microphone, sensor PCB, or permanent wire | Makes real washing plausible |
| V1-MUST-03 | Hopper, dispensing member, chute liner, and bowl/tray are removable from the dry base | Covers the full dirty path |
| V1-MUST-04 | Dry base contains motor, PCB, power and optional smart electronics | Maintains clear wet/dry boundary |
| V1-MUST-05 | Mechanical drive crosses boundary through a detachable coupler | Allows motor to stay dry while cassette comes out |
| V1-MUST-06 | Magnetic alignment plus mechanical locking | Magnets create feel; lock handles safety retention |
| V1-MUST-07 | Assembly-present and lock-state detection | Feeder must not run when cassette is missing or unlocked |
| V1-MUST-08 | Mature dispensing mechanism adapted from proven market patterns | Avoids inventing the feeding mechanism from scratch |
| V1-MUST-09 | Local scheduled feeding continues without internet | Table-stakes reliability, not the headline |
| V1-MUST-10 | Clear cleaning workflow under 60 seconds to remove food cassette | Makes the core promise visible and believable |

## V1 Simplified

| Area | 1.0 Decision |
|---|---|
| App | Basic setup, schedule, manual feed, status, cleaning reminder. No advanced dashboards. |
| Connectivity | Wi-Fi/Bluetooth setup acceptable; core schedule must live locally. |
| Identity | No multi-cat identity control in 1.0. |
| AI | No AI cat recognition in 1.0. |
| Camera | Optional dry module or dummy crowdfunding module only; not required for 1.0 engineering success. |
| Open modules | Mechanical/electrical interface reserved, but no third-party ecosystem at launch. |
| Dishwasher claim | Do not claim unless lab and material validation pass. Default claim: rinse / soak / hand-wash. |
| Wet food | Not supported in 1.0. Dry kibble plus limited freeze-dried mix only after EVT validation. |

## V1 Explicitly Not Doing

- Collar RFID or microchip access control.
- Physical anti-stealing feeding gate.
- AI-only multi-cat feeding promise.
- Medical or prescription-diet compliance claims.
- Fully open third-party module marketplace.
- Dishwasher-safe claim before validation.
- Waterproof dry base claim.
- New proprietary rotor invention unless competitor teardown and EVT prove no mature mechanism can work.

## V1 Architecture

```text
Food Cassette / Wet Zone
  hopper
  dispensing member
  chute liner
  bowl or tray
  passive coupling insert

Boundary
  magnet alignment
  mechanical latch
  gasket / labyrinth / raised splash geometry
  detachable drive coupler
  cassette-present / lock-state detection

Dry Base
  motor and gearbox
  PCB
  power supply and backup battery
  buttons / LEDs / speaker if needed
  optional dry smart module bay
```

## V1 Success Tests

| Test | Pass Target |
|---|---|
| Cleaning removal | User removes full food cassette without tools in under 60 seconds |
| Wet/dry boundary | No rinse water enters dry motor/PCB cavity during defined cleaning abuse test |
| Reassembly | Cassette reseats reliably with tactile alignment and no ambiguous half-lock state |
| Feeding reliability | Mature dispensing mechanism passes jam and dose variation gates across agreed dry-food sample set |
| Residue inspection | No inaccessible food-contact crevice after normal disassembly |
| Safety lock | Pet/child-like accidental interaction does not release cassette |
| Offline feed | Stored schedule executes without internet |

## Version Roadmap

| Version | Focus |
|---|---|
| 1.0 | Washable circuit-free food cassette + reliable dry-food feeding |
| 1.5 | Better maintenance indicators, extra cassette variants, optional dry camera module |
| 2.0 | Identity-controlled feeding station using RFID/microchip/vision plus physical access control |
| 3.0 | Module ecosystem and co-branded cassette/module program |

## Positioning Sentence

AquaClick 1.0 is not "another smart feeder." It is an automatic feeder whose dirtiest food-contact path can be removed and washed like a dedicated food cassette, while all electronics stay protected in the dry base.

