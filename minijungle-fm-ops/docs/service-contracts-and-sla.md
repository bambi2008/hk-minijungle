# Service Contracts and SLA

## Operator path

1. Open **Ops Today -> Service contracts & SLA**.
2. Create a draft from reviewed signed terms. Select one client and only that client's covered living assets.
3. Check dates, service hours, visit frequency, evidence requirement and response/resolution hours for all four priorities.
4. Enter an audit note and activate only when the agreement is effective.
5. Suspend, resume or terminate with the approved commercial reason. The previous state remains in the immutable event history.
6. Monitor `Contract gaps`, expired/expiring coverage and the remediation queue. A new remediation task without an explicit deadline inherits the active contract's resolution time.

## Control rules

- Contract numbers are unique and normalized to uppercase.
- A covered asset must belong to the selected client.
- New records are always drafts; lifecycle changes require a note.
- Stale `updatedAt` values are rejected instead of overwriting another operator.
- Exact idempotency-key replay returns the original command result.
- Response hours cannot exceed resolution hours.
- Activation is rejected when another active contract covers the same asset over an overlapping date range.
- Scheduled, expired, suspended, terminated or missing coverage does not create an SLA deadline.
- An operator-supplied remediation deadline takes precedence over the calculated contract default.
- Client viewers and ESG auditors are read-only and tenant scoped.
- Technician phones receive only route-relevant plan/window/evidence context, not fees or portfolio-wide contracts.

## Production deployment

Apply `infra/postgres/015_service_contracts.sql` after `014_inventory_traceability.sql`. Do not seed pilot contracts in production. Import terms only from reviewed signed agreements, retain the source document reference in the approved records system, and reconcile asset coverage before activation.

Production preflight requires the three contract tables and migration marker `2026-09-06.postgres-service-contracts-v1`. Acceptance should exercise every lifecycle action, each SLA priority, expiry, missing coverage, client scope, notification escalation and one amendment process against real OIDC actors.

## Honest boundary

This feature is a tested operational contract register and SLA-default engine. It is not contract lifecycle management, electronic signature, billing, legal document storage or proof of customer acceptance. No real signed agreement, production SLA history, managed PostgreSQL deployment or independently evidenced off-host restore is present in this repository. Official production operations readiness remains capped at **65%**.
