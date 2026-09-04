# AquaClick V0.1C Release Notes

## What Changed From The V0.1B Handoff Baseline

1. Replaced the simplified axisymmetric hopper assumption with an eccentric compound floor proxy that slopes toward an offset rotor inlet.
2. Recomputed usable-capacity proxies for OD 180 and OD 185 variants after reserving volume for rotor/outlet intrusion and safety headspace.
3. Added washable chute liner geometry proxies with wall thickness, draft, corner radius, snap-tab placeholders and finger-access notes.
4. Added A/B/C rotor dynamic envelope STLs and a rotor/window/channel minimum-passage proxy matrix.
5. Added envelope models for floating coupler, dual-side quick release, center-lever quick release and load-cell force path.
6. Added DFMEA seed, risk register, EVT matrix and OEM RFQ checklist.

## V0.1C.1 Clearance Adjustment

After the first V0.1C clearance run, `Rotor C + Window A` measured 14.8 mm in the minimum-passage proxy for both standard and wide channels. `Window A` width has therefore been widened from 18.0 mm to 19.5 mm in this package build. This makes all proxy combinations meet or exceed the 15 mm check, but it does not prove real-food anti-jam performance.

## Files Generated

- `od180`: gross_volume_l=4.821810790739299, usable_volume_l=4.591810790739299, fill_z_mm=242.0, min_floor_angle_deg=24.370975101723346, max_floor_angle_deg=28.14224414455449, stl=aquaclick_v01c_od180_eccentric_hopper.stl
- `od185`: gross_volume_l=5.10031070182536, usable_volume_l=4.85031070182536, fill_z_mm=242.0, min_floor_angle_deg=24.03609151409117, max_floor_angle_deg=27.632333762796133, stl=aquaclick_v01c_od185_eccentric_hopper.stl
- `rotor_A_dynamic_envelope`: diameter_mm=58.4, height_mm=28.0, stl=aquaclick_v01c_rotor_A_dynamic_envelope.stl
- `rotor_B_dynamic_envelope`: diameter_mm=64.8, height_mm=30.0, stl=aquaclick_v01c_rotor_B_dynamic_envelope.stl
- `rotor_C_dynamic_envelope`: diameter_mm=71.2, height_mm=32.0, stl=aquaclick_v01c_rotor_C_dynamic_envelope.stl
- `chute_liner_standard`: inner_w_mm=24.0, inner_h_mm=22.0, length_mm=82.0, stl=aquaclick_v01c_chute_liner_standard.stl
- `chute_liner_wide`: inner_w_mm=30.0, inner_h_mm=24.0, length_mm=88.0, stl=aquaclick_v01c_chute_liner_wide.stl

## Version Caveat

Because the original `AquaClick_V0.1B/` and `build_aquaclick_cad_v01b.py` were not found in the workspace, this package preserves continuity through the handoff document and explicit assumptions. It should be reconciled with the original V0.1B package if that package is later restored.
