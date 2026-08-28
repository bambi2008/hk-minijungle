# Module Commissioning and Physical Asset Lifecycle

## Purpose

This workflow connects a database module to one real DR FOREST unit in a client space. A generated module ID is only a planning placeholder. It is not evidence that hardware exists, has been installed, or is operating.

## Short Operating Path

1. FM Lead opens **Ops Admin > Commissioning** and assigns the real serial number, field asset code, hardware revision and exact site position.
2. The field technician opens the asset code on the phone and confirms the identity label, physical mount, water circuit and electrical safety checks.
3. A different FM Lead or Platform Admin confirms the sensor mapping and fixed camera view, then independently marks the unit verified.
4. Suspension and retirement require an audit note. Retirement is terminal; replacement hardware receives its own physical identity and history.

## Controls

- Serial numbers and field asset codes are unique.
- Every mutation requires an idempotency key.
- Every transition requires the latest `updatedAt` value, preventing stale-page overwrite.
- An installer cannot verify the same module.
- Verification is blocked until temperature, humidity, CO2, MC and camera records are mapped.
- Plan, install, verify, suspend and retire events are immutable and client scoped.
- A field asset code identifies a module but grants no access; normal authenticated role and client-scope checks still apply.

## Honest Boundary

The pilot database contains generated module IDs and generated device registry placeholders. They remain `unplanned` until an operator records a real serial number. A verified application record does not replace a signed site acceptance form, electrical certification where required, calibrated hardware evidence, or a real multi-client deployment history.
