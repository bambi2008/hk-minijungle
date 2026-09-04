# AquaClick V0.2 Wet / Dry Architecture

## Architecture Principle

Everything that touches food or receives food dust should be removable and washable. Everything electrical stays in the dry base or sealed expansion modules.

## Wet Zone

- Transparent food hopper.
- Hopper lid seal and desiccant holder if washable boundary permits.
- Removable rotor / dispensing wheel.
- Removable chute liner.
- Bowl or bowl tray.
- Non-electrical mechanical coupler insert if food-contact-safe.

Wet zone must not contain:

- PCB.
- Battery.
- Motor.
- Permanent wire harness.
- Camera.
- Load-cell electronics.
- Speaker or microphone.
- Non-sealed pogo/contact board.

## Dry Zone

- Motor and gearbox.
- Main PCB.
- Power input and backup battery.
- Load-cell electronics.
- Camera / AI module.
- Speaker, microphone, display or status LED.
- Pogo/contact controller for dry expansion modules.

## Boundary Requirements

| Boundary | Requirement |
|---|---|
| Mechanical drive | Torque transfers through a detachable coupler; wet part can be washed separately |
| Water/dust | Labyrinth or gasket boundary prevents rinse water and food dust from entering motor cavity |
| User action | User can remove wet zone without tools |
| Safety | Unit cannot run when wet assembly is absent or unlocked |
| Cleaning | No hidden dead corner in normal food-contact flow path |

## Open Engineering Questions

1. Can the rotor stay entirely in the wet zone while the motor remains in the dry zone?
2. Should the motor drive through a vertical shaft, horizontal shaft or keyed floating coupler?
3. Can the load-cell system remain under the bowl without compromising washability?
4. Is a dishwasher-safe claim strategically worth the validation burden, or should V1 claim rinse/soak/hand-wash only?
