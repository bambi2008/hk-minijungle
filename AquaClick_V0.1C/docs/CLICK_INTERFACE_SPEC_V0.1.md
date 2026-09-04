# AquaClick Click Interface Spec V0.1

## Purpose

Define a repeatable physical and electrical interface for AquaClick modules. The first use is the washable food assembly connection. Later uses include camera, AI, expression display and co-branded modules.

## Interface Layers

| Layer | Role | V0.1 Direction |
|---|---|---|
| Alignment | Fast user positioning and premium feel | Magnet pairs plus lead-in geometry |
| Retention | Prevent lift-off, pet misuse and vibration release | Mechanical hooks / latch, not magnet-only |
| Sealing | Separate washable wet zone and dry electronics | Gasket, labyrinth, raised splash boundary |
| Drive | Transfer torque to removable rotor if required | Floating keyed coupler with axial/radial tolerance |
| Electrical | Optional for dry modules only | Pogo pins or sealed connector, no wet food path contacts |
| Identity | Module recognition | resistor ID / 1-wire / low-speed handshake, later decision |

## Mechanical Envelope Draft

- Primary module insertion: vertical drop-in with front tactile Click.
- Alignment tolerance target: +/- 1.0 mm before magnetic capture.
- Retention target: enough to resist pet pawing and accidental lift; exact force must be bench tested.
- Release action: deliberate two-step action for wet food assembly; one-handed acceptable only if mis-release is controlled.
- Visible feedback: physical seated line plus app/LED confirmation if dry electronics can detect lock state.

## Electrical Guardrails

- Food-contact wet assembly should be passive by default.
- If a module needs power, it must be outside the washable food path or independently sealed.
- No mandatory cloud subscription for core feeding schedule.
- Module ID must not allow unapproved high-power modules without safety negotiation.

## Module Classes

| Class | Examples | Allowed In V1 |
|---|---|---|
| Passive wet module | hopper, chute, bowl trim, food-safe collab insert | Yes |
| Dry smart module | camera, expression display, status light | Yes after connector validation |
| Regulated food-contact module | treat insert, special food insert | Later; needs material and liability review |
| Third-party powered module | partner hardware | Later; requires certification program |

## Next Spec Decisions

1. Magnet grade, count, placement and shielding.
2. Latch geometry and release action.
3. Coupler torque target and tolerance stack.
4. Seated/locked detection method.
5. Connector pinout for dry modules.
