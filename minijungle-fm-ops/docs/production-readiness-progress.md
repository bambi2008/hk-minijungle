# DR FOREST OPS Production Readiness Progress

## Scoring Rule

This score tracks readiness for real Hong Kong FM operations at 1,000+ living-green modules. It does not measure investor-demo polish.

## Baseline

- Date: 2026-07-14
- Baseline score: 28%
- Reason: The app has a strong investor-grade product frame and static MVP demo, but it still lacks production backend, database persistence, permissions, mobile technician workflows, device integrations, and operational data pipelines.

## Progress Log

### Step 1 - API Foundation

- Target score after completion: 31%
- Capability added: Node server API layer for portfolio health, asset index, and server-side operations events.
- Why this matters: Moves the platform from a pure static demo toward service-side data boundaries and event persistence.
- Still not solved: It is not a production database, not multi-user authentication, not mobile offline sync, not sensor ingestion, and not a real audit-grade event store.

### Step 2 - Production Data Model and Quality Gate

- Target score after completion: 35%
- Capability added: Shared production data model, normalized production seed, data-quality API, and automated relationship validation.
- Why this matters: The platform now has a testable entity map for clients, sites, living assets, modules, work orders, proof records, sensor readings, incidents, service slots, invoices, compliance items, inventory and operations events.
- What is objectively better: Broken references, duplicate IDs, invalid health scores, missing work-order/proof/sensor relationships and basic stock issues can now fail a test instead of hiding inside demo JSON.
- Still not solved: The data still lives in JSON files and JSONL events. Plant Pod records are aggregate counts, proof files lack object-storage hashes/URLs, sensors are not time-series ingestion, and auth/roles are not production-grade.

### Step 3 - Server-Side State Persistence v1

- Target score after completion: 40%
- Capability added: Server-side operations state snapshot, revision tracking, state summary API, and browser UI synchronization to the server state store.
- Why this matters: Core UI actions can now persist beyond one browser's localStorage and can be recovered from the local server runtime.
- What is objectively better: AI queue, work-order completion, proof approval, sensor acknowledgement, invoice payment, schedule confirmation, incident resolution, compliance clearance, quick tasks and audit events now have a server-side state path.
- Still not solved: This is a JSON-file state store, not a production database. It does not provide multi-user conflict control, authentication, access policy, tenant isolation, object storage, background jobs or high-availability deployment.

### Current Honest Score

- Production-readiness score: 40%
- Investor-demo score remains higher, but should not be mixed into the production-readiness score.
