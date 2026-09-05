# Client Service Feedback Loop

## Purpose

This module closes the client-facing service loop without turning a portal comment into an unverified KPI. A client viewer can submit a rating and follow-up request against a work-order or visit reference. An FM lead can acknowledge it, add a review note, and close it after the follow-up is handled.

## Flow

1. Client portal submits `serviceRef`, `rating`, `outcome`, `followUpRequired` and `comment`.
2. The API validates client scope and requires an `Idempotency-Key`.
3. SQLite or PostgreSQL stores the feedback in `ops_client_service_feedback`.
4. The submission is appended to the operations timeline as `client.service-feedback.submitted`.
5. Ops Today lists all scoped feedback. Submitted items can be acknowledged; acknowledged items can be closed.
6. Every review requires a note, a different reviewer, and the `expectedUpdatedAt` value from the page. A stale page receives a `409` instead of overwriting a newer review.

## API surface

- `GET /api/service-feedback`: list by client scope, status and bounded limit.
- `POST /api/service-feedback`: create a client or FM submission. Requires `client.feedback.write`.
- `POST /api/service-feedback/:id/review`: acknowledge or close. Requires `client.feedback.review`.
- `GET /api/storage` and `GET /api/health/ready`: expose table count, open follow-ups, average rating, migration version and foreign-key issues.

## Data boundary

The average rating is a descriptive operational signal, not a claimed customer-satisfaction study. The module is locally tested with seeded data and is ready to accept future Airtable imports, but it does not prove a real customer cycle until a named client submits feedback, FM reviews it, and the follow-up is independently confirmed in the field.

## Storage

- SQLite fallback: `ops_client_service_feedback`, migration marker `2026-09-04.client-service-feedback-v1`.
- PostgreSQL path: migration `infra/postgres/021_client_service_feedback.sql`, marker `2026-09-04.postgres-client-service-feedback-v1`.
- Foreign-key relationship: `client_id -> clients.id`, delete restricted.

