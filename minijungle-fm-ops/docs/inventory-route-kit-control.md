# Inventory and Route Kit Control v1

## Operating purpose

This module controls consumables between the Hong Kong warehouse, technician route kits and field visits. It is deliberately smaller than a procurement ERP: purchasing prices, supplier invoices and accounting valuation remain outside the boundary.

## Shortest operating paths

1. FM Lead receives or adjusts stock through an idempotent inventory movement.
2. FM Lead reserves stock against an assigned work order.
3. FM Lead loads the technician route kit. A work-order-linked transfer consumes the matching reservation.
4. The technician records nutrient, replacement pod and Xponge use in the existing visit form.
5. The visit evidence is saved first. Inventory posts with the same capture-batch identity; a stock mismatch creates an auditable exception without losing field proof.

## Controls

- Every stock change creates an immutable transaction row; balances cannot be edited through the UI.
- Warehouse-to-kit transfers create equal transfer-out and transfer-in rows in one database transaction.
- On-hand and reserved values cannot be negative, and reserved stock cannot exceed on-hand stock.
- Mutation APIs require `Idempotency-Key`; mobile use is idempotent by capture batch plus SKU.
- Field technicians can read only their own kit and consume only against actively assigned work orders.
- Production PostgreSQL receives schema only. Pilot seed quantities are never injected into production.

## API surface

- `GET /api/inventory/overview`
- `GET /api/mobile/route-kit`
- `POST /api/inventory/transactions`
- `POST /api/inventory/reservations`
- `POST /api/inventory/consume`

## Honest boundary

This release does not prove physical cycle counts, barcode scanning, purchase-order approval, supplier integration, expiry/lot tracking or repeated real warehouse use. It improves workflow completeness and auditability, but the official production operations score remains **65%** under the managed PostgreSQL and off-host restore hard cap.
