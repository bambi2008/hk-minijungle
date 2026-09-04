# Geometry Check Report V0.1C

## Digital Checks Completed

- STL files generated as ASCII mesh assets in millimeter-scale assumptions.
- OD 180 and OD 185 hopper variants include an offset low point near the rotor inlet.
- Rotor A/B/C dynamic envelopes generated as clearance cylinders.
- Chute liner standard/wide variants generated as outer-envelope proxies.
- Clearance matrix generated for all rotor x window x channel combinations.

## Capacity Proxy

The hopper capacity is computed as a conservative proxy, not a fluid/particle fill simulation. It deducts approximate rotor/outlet displacement and safety headspace. Real fill behavior with kibble and freeze-dried pieces must be tested.

## Known Digital Limitations

- No OpenCascade/CadQuery kernel is available in this environment, so STEP export and B-rep validation are not included.
- Rounded corners, snap tabs, latch faces and flexible silicone vanes are represented as placeholders or envelopes.
- Dynamic rotor simulation is a swept-volume proxy, not a contact/friction simulation.
