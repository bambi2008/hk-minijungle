# DR FOREST OPS Progress Scoring Governance

## Purpose

This document prevents progress inflation. The only score that should be reported as "current completion" is real production-readiness for running Hong Kong FM operations across 1,000+ living-green modules.

Investor-demo polish, backend scaffolding and isolated API completion must not be mixed into that score.

## Three Scores Must Stay Separate

- Investor-demo readiness: how convincing the story and demo are for investor presentation.
- Architecture scaffold readiness: how much backend/data structure exists in code.
- Production operations readiness: whether DR FOREST can actually run daily FM operations at scale with real users, real devices, real evidence, supportability and data accumulation.

Only production operations readiness is the official progress score.

## Official Scoring Dimensions

The production score must be judged across these dimensions:

- Data and persistence: durable schema, migrations, relational integrity, backup/restore, production database readiness.
- Workflow completeness: end-to-end user journeys for FM lead, technician, client and auditor.
- Real integrations: mobile capture, object storage, sensor/time-series ingestion, IAM/SSO and future robot/device interfaces.
- Operational UI: working admin/ops/client screens for the same capabilities exposed by APIs.
- Security, compliance and auditability: tenant isolation, permissions, immutable evidence, privacy controls, audit trail and recovery.
- Reliability and scale: deployment, monitoring, logging, alerting, queueing, load behavior, failure recovery and support playbooks.
- Data quality and analytics: normal data accumulation, health scoring, ESG proof packs, reporting and trend analysis.

## Hard Caps

Use the lowest applicable cap when reporting the official production score.

- Without a production database service and backup/restore path, the score cannot exceed 65%.
- Without real file upload/object storage for proof media, the score cannot exceed 66%.
- Without sensor time-series ingestion and a health scoring pipeline, the score cannot exceed 67%.
- Without a real technician mobile/offline UI, the score cannot exceed 68%.
- Without production IAM/SSO/session management, the score cannot exceed 70%.
- Without monitoring, logging, deployment and recovery playbooks, the score cannot exceed 70%.
- Without complete operational UI for admin, field, client and auditor workflows, the score cannot exceed 72%.
- Without real multi-client pilot data and repeated operational use, the score cannot exceed 78%.

## Step Reporting Rule

Every future step must report:

- Score before.
- Score after.
- Which scoring dimensions improved.
- Evidence added.
- What is still not solved.
- Applicable hard caps.
- Whether the score is production-readiness, architecture scaffold readiness or investor-demo readiness.

If a step adds backend tables or APIs but no usable UI, real integration, deployment, or real operational data, it may improve architecture scaffold readiness but should only move the official production score modestly.

## Current Recalibration

Date: 2026-07-15

Official production operations readiness is recalibrated to 62%.

Reason: Steps 1-10 built meaningful API, SQLite, permission, master-data, mobile-capture and proof-media metadata foundations, but the platform is still not ready for real 1,000+ module operations because it lacks production database deployment, real mobile app/offline queue, real object storage upload, sensor time-series/health scoring, production IAM, monitoring, backup/restore, and complete workflow UI.

Architecture scaffold readiness may be described separately as roughly 70-75%, but that is not the official production score.
