# Inventory Traceability and Counts

## Operator path

1. Open **Ops Today → Route kits & stock → Lot receipt & stock-count review**.
2. Record the SKU, supplier batch code, supplier, received quantity and expiry date. The receipt updates aggregate and lot balances in one database transaction.
3. Reserve and load a route kit through the existing controls. The server allocates lots by FEFO: earliest expiry first.
4. The technician sees the first lot to use on the phone. Visit consumption remains one-step; the server records the selected lot allocation in the inventory transaction.
5. At route end, the technician opens **Count route kit**, enters physical quantities and submits. Submission does not change stock.
6. A different FM Lead or Platform Admin reviews the variance with a note. Approval posts both lot-level and aggregate adjustments; rejection leaves stock unchanged.

## Controls

- Supplier lot code is unique within an SKU.
- Receipt expiry cannot precede receipt date.
- Inventory writes require an idempotency key.
- FEFO allocation is database ordered and transaction protected.
- Historical stock without a lot is reported as `untrackedQuantity`; it is never relabelled as traceable evidence.
- A technician can count only their own route kit.
- The counter cannot approve their own count.
- Approval fails if a lot balance changed after count submission or if an adjustment would reduce aggregate stock below reserved quantity.
- Lot movements and count adjustments are immutable ledger entries.

## Production deployment

Apply `infra/postgres/014_inventory_traceability.sql` after migration `013`. Production starts with empty lot tables. Do not create synthetic opening lots for live stock: perform an approved opening physical count and controlled lot receipt/import.

Production preflight requires the five traceability tables and migration marker `2026-09-05.postgres-inventory-traceability-v1`.

## Honest boundary

This release provides a tested application and database control, not evidence that a Hong Kong warehouse has completed a physical count. Barcode/QR scanners, supplier purchase orders, temperature-controlled storage evidence, stock valuation and repeated live reconciliation cycles remain outside this workspace. Managed PostgreSQL and an independently evidenced off-host restore still cap official production operations readiness at **65%**.
