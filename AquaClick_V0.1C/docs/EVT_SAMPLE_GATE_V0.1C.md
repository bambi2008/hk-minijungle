# AquaClick V0.1C EVT Sample Gate

## Gate Intent

This gate defines what must be true before AquaClick V0.1C geometry is treated as ready for EVT sample fabrication discussion. Passing this gate does not mean the product is validated; it only means the digital package is coherent enough to ask OEM/prototype partners for cost, DFM feedback and sample planning.

## Digital Gate Criteria

| ID | Criterion | V0.1C.1 Status |
|---|---|---|
| G-DIG-01 | Food boundary fixed as dry kibble + limited freeze-dried, 5-15 mm, <=20% freeze-dried volume for EVT planning | Pass |
| G-DIG-02 | OD 180 and OD 185 eccentric hopper variants generated | Pass |
| G-DIG-03 | Rotor A/B/C dynamic envelopes generated | Pass |
| G-DIG-04 | Rotor x window x channel minimum-passage proxy checks >= 15 mm | Pass after Window A widened to 19.5 mm |
| G-DIG-05 | Washable liner has wall/draft/radius/latch assumptions documented | Pass as proxy |
| G-DIG-06 | Washable and dry electrical boundaries documented | Pass |
| G-DIG-07 | DFMEA seed and risk register available | Pass |
| G-DIG-08 | Physical validation items explicitly separated from digital checks | Pass |

## OEM Must Answer Before EVT Tooling Or Prototype Spend

1. Whether OD 180 mm can hold target usable capacity after real ribs, draft, outlet intrusion and molded detail are added, or whether OD 185 mm should become EVT default.
2. Whether the widened Window A causes unacceptable rotor leakage, dose scatter, wall weakness or tool complexity.
3. Whether the washable chute liner snap-fit can survive repeated removal without residue traps.
4. Whether the quick-release mechanism should continue with dual-side, center-lever, or both for EVT.
5. Which material stack is realistic for transparent food-contact hopper, liner, rotor and seal.
6. Which prototype process can approximate flexible silicone rotor behavior enough for EVT learning.

## Do Not Claim At This Gate

- No jam / anti-jam.
- Dishwasher safe.
- IPX rating.
- Accurate dosing across all kibble.
- Food-contact compliance.
- Production-ready CAD, mold-ready CAD or validated STEP.

## Recommended EVT Sample Matrix

| Axis | Options |
|---|---|
| Hopper OD | 180 mm, 185 mm |
| Rotor | A, B, C |
| Window | A widened, B, C |
| Chute | standard, wide |
| Food | small dry kibble, mixed dry kibble, large 15 mm kibble, 20% freeze-dried mix |
| Quick release | dual-side, center-lever |

Minimum practical first pass: choose OD 185, Rotor A/B/C, Window A/B/C, standard/wide chute and four food mixes. Keep OD 180 as a capacity-risk comparison sample if budget allows.
