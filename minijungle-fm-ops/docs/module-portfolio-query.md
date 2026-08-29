# Module Portfolio Query v1

Step 68 adds a bounded, tenant-scoped query contract for the module portfolio. It is the read path used by the Ops Today module health panel.

## API

`GET /api/modules`

Supported query parameters:

- `limit`: positive integer, default `20`, maximum `100`.
- `cursor`: opaque base64url continuation cursor returned by the previous page.
- `search` or `q`: case-insensitive match against module id, label, wall id or zone, maximum 80 characters.
- `wallId`: restricts results to one wall.
- `clientId`: restricts results to one client and is checked against the caller scope.
- `status` or `statuses`: comma-separated status values.

The response keeps the existing `modules` array for compatibility and adds:

```json
{
  "modules": [],
  "page": {
    "limit": 20,
    "total": 0,
    "hasMore": false,
    "nextCursor": null
  },
  "filters": {
    "search": null,
    "wallId": null,
    "clientId": null,
    "statuses": [],
    "limit": 20
  }
}
```

## Ordering and cursor rules

Both SQLite and PostgreSQL use the same stable order: `asset_id ASC`, `position ASC` with null positions last, then `id ASC`. The cursor contains only the last row's ordering keys and is treated as opaque by clients. The next query applies a strict greater-than comparison, so records are not repeated when a page is loaded.

The cursor is query-independent. A caller must keep the active filters unchanged while following it; changing filters starts a new query from the first page. Invalid cursors return HTTP 400 with `MODULE_QUERY_CURSOR_INVALID`.

## Scope and performance boundary

The server applies the authenticated principal's client scope in the database query. Client and field-tech users cannot widen the result set by omitting or changing `clientId`; an explicit out-of-scope client is rejected. Search values and filter lists are parameterized, and the page size is capped before SQL execution.

The endpoint now avoids returning the entire portfolio on every refresh. This is a production-shaped read path for thousands of modules, but local tests do not prove production latency, database capacity, cache behavior, or a live 1,000-module field portfolio. Managed PostgreSQL sizing, observability thresholds, and load evidence remain release gates.
