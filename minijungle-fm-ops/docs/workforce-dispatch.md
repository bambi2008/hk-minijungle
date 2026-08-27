# Workforce Dispatch v1

## Purpose

The workforce ledger replaces free-text assignee entry with an operationally controlled technician roster. Airtable may still hold early maintenance history, but dispatch decisions in DR FOREST OPS are checked against current technician capacity before a work order or remediation task is assigned.

## Technician profile

Each technician has a stable principal ID, display name, active/inactive state, skills, covered Hong Kong districts, shift start/end and maximum daily service minutes. The ID is designed to map to the future OIDC user `sub`; a name alone is never an assignment key.

The current skill vocabulary is intentionally small:

- `plant-care`
- `visual-diagnosis`
- `sensor-care`
- `device-care`
- `*` for a reviewed all-skills pilot profile

## Assignment checks

Before persistence, the server checks:

1. The technician exists and is active.
2. The service district is covered.
3. Every task-required skill is present.
4. Projected daily minutes do not exceed the technician limit.
5. A scheduled start fits inside the shift.
6. A scheduled interval does not overlap another active assignment.

Rejected assignments return `WORKFORCE_ASSIGNMENT_INELIGIBLE` with the first actionable reason. UI dropdowns show eligible technicians and remaining minutes, but the API repeats every check so direct requests cannot bypass the rules.

## Operator path

1. Open **Ops Today → Field workforce** and choose the service date.
2. Select one or more remediation tasks.
3. Choose a shared eligible technician in **Assign to**.
4. Set deadline, priority or status only when needed, then apply once.

The phone route uses active `work-order` assignments. A field technician sees only work orders assigned to that principal and inside the principal's client scope. Completing the work-order reminder closes its capacity assignment. Remediation acceptance, evidence submission, rejection/resumption and approval update the same capacity ledger.

## API surface

- `GET /api/workforce/technicians`
- `POST /api/workforce/technicians`
- `GET /api/workforce/candidates?serviceDate=YYYY-MM-DD&taskIds=...`
- `GET /api/workforce/assignments`
- `POST /api/workforce/assignments`

FM Lead and Platform Admin manage and assign. Field Technician can read only the technician's own profile and assignments. Client Viewer has no roster access.

## Honest limits

- This is capacity and eligibility control, not GPS route optimisation or travel-time prediction.
- The SQLite pilot seeds one clearly labelled demo technician and one demo work-order assignment; PostgreSQL production does not seed staff.
- Roster creation is manual API data entry in v1; OIDC/HR directory provisioning is not connected.
- Remediation and workforce records use compensating application orchestration, not one reviewed cross-table transaction across every bulk task.
- No real shift roster, absence feed, collective-agreement rule, live dispatch acceptance metric or repeated field-cycle evidence has been supplied yet.
