# DR FOREST OPS Production Evidence Record

This record is required before calling the platform production-ready for 1,000+ living modules. It is an evidence register, not a self-attested scorecard.

## Rules

- `configured` means the application can read a valid setting. It is not field evidence.
- `observed` means a health or storage endpoint returned the expected backend. It is not proof of a successful operating cycle.
- `verified` requires a dated artifact, operator, environment, sample IDs and an independent review or FM partner sign-off.
- The CLI report must never change the official production score. The current official score remains **65%** until this record and the external release gates are complete.

## Required evidence

| Evidence | Required artifact | Owner | Date | Status |
| --- | --- | --- | --- | --- |
| PostgreSQL migration | Migration ID, source SHA-256, per-table counts, FK/orphan report |  |  | missing |
| Off-host restore | Encrypted backup manifest, checksum, isolated restore log |  |  | missing |
| OIDC/MFA/client scope | Login, MFA, role, client scope and revocation test |  |  | missing |
| Signed device pilot | Real gateway/module IDs, accepted/rejected HMAC and replay evidence |  |  | missing |
| Camera/object storage | Private upload/readback, SHA-256, retention and quarantine result |  |  | missing |
| AI provider | Provider/model, latency, cost, sample set, human override and failure path |  |  | missing |
| Monitoring | Alert delivery, escalation, recovery and incident record |  |  | missing |
| Multi-client operations | Two repeated cycles, client IDs, SLA, exceptions and operator time |  |  | missing |

## CLI collection

```powershell
$env:DR_FOREST_EVIDENCE_PRINCIPAL = "fm-lead"
npm.cmd run evidence:production -- --url http://127.0.0.1:8033/ --out .\artifacts\production-evidence.json
```

For production, use an OIDC bearer token instead of a pilot principal:

```powershell
$env:DR_FOREST_EVIDENCE_BEARER_TOKEN = "<short-lived-token>"
npm.cmd run evidence:production -- --url https://ops.example.com/ --strict
```

`--strict` exits non-zero when the ready endpoint is unavailable, the server is not in production mode, or a required evidence marker is not independently observed. A successful command still does not authorize release; the dated artifacts above must be reviewed.

## Observability artifact

Attach the protected `/api/metrics` response together with the hosting-platform log sink configuration, one delivered alert, one escalation and one recovery notification. The metrics response alone is an application-level observation, not monitoring proof.

For the notification outbox, attach the outbox row ID, signed webhook request, receiver response, retry/failure history and final operator escalation result. A `delivered` row without receiver-side evidence is not sufficient.
