# DR FOREST Health Score and ESG Operational Ledger

## Purpose

This module turns daily FM evidence into an explainable operating view. It helps the FM Lead decide what needs attention and gives a client or auditor a traceable period ledger. It does not create a certificate, assurance opinion or automatic sustainability claim.

## Operational health score

Each living wall is scored from 0 to 100 when enough evidence exists:

| Factor | Weight | Current evidence |
| --- | ---: | --- |
| Visual condition | 45% | Numeric technician health-check item from a synced mobile capture |
| Environment | 25% | Latest temperature, humidity, CO2 and MC status for active modules |
| Service execution | 20% | Synced service batches, reduced only by recorded exception items |
| Exception control | 10% | Active sensor alerts and pending AI reviews |

The score is normalized over available factors, but it is withheld as `no-data` until at least 50% of the weighted inputs are present. Every published score includes factor detail, confidence, evidence references and method version `2026-08-29.operational-health-esg-v1`.

The score is for operational triage. It is not a horticultural certification, medical statement, indoor-air claim or ESG assurance result. AI vision remains a provider port with human review; a queued diagnosis is not a diagnosis.

## ESG period ledger

The FM Lead generates a period ledger for the full portfolio or one client. The ledger includes:

- Asset master facts: live green area and configured staff/visitor reach.
- Measured field facts: service batches, proof photos, water added, nutrient added and numeric visual health checks.
- Structured observations: Xponge root-zone checks, pest/disease observations, chemical interventions, staff/visitor pulse and green brand touchpoints.
- Operational links: health score, sensor alerts, pending AI diagnoses and evidence references.
- Estimates: legacy water-saved fields remain labeled `estimated` and are excluded from measured totals.
- Gaps: missing capture, observation category or health score is shown explicitly.

The ledger is `complete` only when the required period evidence exists. A missing pest/disease record does not mean that pests were absent. A staff pulse does not prove productivity improvement. A brand touchpoint does not prove revenue impact. A chemical-intervention record does not calculate reduction without a baseline.

## Operating path

1. Technician completes the existing mobile visit and syncs photos, water, nutrient, health-check and exception items.
2. Sensor and camera adapters post readings and captures through the existing device ports.
3. FM Lead opens Ops Today, reviews drivers, recomputes health and opens the observation entry when a structured ESG fact is known.
4. FM Lead generates the client period ledger, reviews gaps and stores the ledger record.
5. Client viewer and ESG auditor read the same scoped ledger. External reporting or assurance remains a separate review step.

## API contract

```text
GET  /api/ops/health
POST /api/ops/health/recompute       Idempotency-Key required
GET  /api/esg/ledger
POST /api/esg/ledger/recompute       Idempotency-Key required
GET  /api/esg/observations
POST /api/esg/observations           Idempotency-Key required
```

SQLite pilot persistence uses `health_score_snapshots`, `ops_esg_observations` and `ops_esg_period_ledgers`. PostgreSQL deployment uses the same relational contract from `infra/postgres/018_health_esg_operational_ledger.sql`. Foreign keys protect client, asset, module and work-order references.

## Current production boundary

The code and local tests prove the data path and controls. They do not prove real hardware coverage, calibrated thresholds, external AI performance, customer survey quality, period-over-period ESG impact, managed PostgreSQL availability or off-host recovery. The official production-readiness score therefore remains **65%**.
