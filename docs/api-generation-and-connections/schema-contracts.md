---
sidebar_position: 9
title: Schema Contracts
id: schema-contracts
description: "Lock the public shape of a SQL-backed API, detect drift against the live database, and optionally enforce the contract at runtime"
keywords: [schema contract, drift detection, breaking change, API contract, schema lock, runtime enforcement, OpenAPI]
difficulty: "advanced"
---

# Schema Contracts

A generated API follows your database. That is the point — and also the risk: someone drops a column, renames a field, or widens a type, and every consumer of the API discovers it at runtime.

**Schema Contracts** let you lock the shape a SQL service exposes, then tell you when the live database drifts away from it. You can stop there and treat drift as information, or turn on runtime enforcement and have DreamFactory hold the API to the locked shape until you deliberately promote a new one.

Contracts are managed under `/api/v2/system/schema_contract/...` and in the admin UI under **Schema Contracts**.

---

## The workflow

1. **Lock** a table — DreamFactory captures a snapshot of its current shape as the active contract.
2. **Diff** — drift is computed against the live database whenever you look, so it is always current rather than a cached verdict.
3. **Promote** — when the drift is intended, promote to make the current shape the new contract.

---

## Locking a table

```bash
curl -X POST \
  "https://{instance}/api/v2/system/schema_contract/{service}/tables/{table}/lock" \
  -H "X-DreamFactory-API-Key: {api_key}"
```

Each lock stores a versioned snapshot. Previous versions are retained as archives — see [Retention](#retention) below.

---

## Reading contracts and drift

| Endpoint | Returns |
| --- | --- |
| `GET /system/schema_contract/{service}` | Service-level contract status |
| `GET /system/schema_contract/{service}/tables` | Every table and its contract status |
| `GET /system/schema_contract/{service}/tables/{table}/snapshot` | The active locked contract |
| `GET /system/schema_contract/{service}/tables/{table}/snapshots` | Snapshot history (append `/{version}` for one) |
| `GET /system/schema_contract/{service}/tables/{table}/diff` | Drift for one table |
| `GET /system/schema_contract/{service}/diff` | Drift across the whole service |
| `GET /system/schema_contract/{service}/tables/{table}/openapi` | OpenAPI schema generated from the contract |
| `GET /system/schema_contract/{service}/openapi` | OpenAPI for the whole service |

### Drift severity

Every difference is classified, which is what makes drift actionable rather than just a list of changes:

| Severity | Meaning |
| --- | --- |
| `breaking` | Consumers will break — a column the contract promised is gone or incompatible |
| `potentially_breaking` | May break consumers depending on how they use the field |
| `additive` | New surface; existing consumers are unaffected |
| `cosmetic` | No consumer-visible effect |

---

## Testing and promoting

Validate a table against its contract without changing anything:

```bash
curl -X POST \
  "https://{instance}/api/v2/system/schema_contract/{service}/tables/{table}/test" \
  -H "X-DreamFactory-API-Key: {api_key}"
```

Accept the current shape for the whole service:

```bash
curl -X POST \
  "https://{instance}/api/v2/system/schema_contract/{service}/promote" \
  -H "X-DreamFactory-API-Key: {api_key}"
```

:::note[Promotion requires a mode]
A service whose `mode` is `none` cannot be promoted — the call fails with a message telling you to set `mode` to `auto` or `strict` first, via `PATCH /system/schema_contract/{service}`.
:::

Remove a contract with `DELETE .../tables/{table}` for one table, or `DELETE .../{service}` for the whole service.

---

## Service settings

`PATCH /api/v2/system/schema_contract/{service}` configures how a service treats its contracts:

| Setting | Values | Meaning |
| --- | --- | --- |
| `mode` | `none`, `auto`, `strict` | Whether contracts apply to this service at all, and how snapshots are managed. `none` also blocks promotion. |
| `runtime_enforcement` | `off`, `shape_response`, `strict` | Whether the contract is enforced on live traffic. See below. |
| `archive_retention_count` | integer | How many archived snapshots to keep per table. |
| `enabled` | boolean | Master switch for the service's contracts. |

---

## Runtime enforcement

By default (`off`) a contract is documentation and a drift signal — it never touches live traffic. The other two modes change that:

**`shape_response`** — on the way out, response fields that are not in the table's active locked contract are stripped. This applies to *every* verb's response body, including the rows returned by `POST`, `PUT`, `PATCH` and `DELETE` acknowledgements via `?fields=`, so a column added to the database stays invisible to consumers until you re-lock or promote.

**`strict`** — everything `shape_response` does, plus writes are rejected before they run when the payload references fields outside the contract, or writes to fields the contract marks read-only. Payloads are inspected in any of the shapes DreamFactory accepts: wrapped in `resource`, a bare list, or a bare record.

:::warning[shape_response hides new columns from consumers]
This is the intended behaviour — a locked contract means the API's shape does not change under consumers' feet — but it does mean that adding a column to the database and expecting it in API responses will appear to do nothing until the contract is promoted. If a new field is "missing" from responses on a service with enforcement on, check the contract before checking the database.
:::

---

## Command line

```bash
# Emit the canonical JSON schema for a service (or one table)
php artisan schema-contracts:describe {service} [--table=orders] [--pretty]

# Delete surplus archived snapshots per each service's archive_retention_count
php artisan schema-contracts:prune [--service=name] [--dry-run]
```

`--dry-run` reports what would be deleted without applying it.

---

## Retention {#retention}

Every lock and promotion archives the previous snapshot. `archive_retention_count` caps how many are kept per table, and `schema-contracts:prune` applies that policy — run it on a schedule if you lock frequently.

---

## Next steps

- **[Generating a Database-Backed API](./api-types/database/generating-a-database-backed-api)**: Create the service a contract locks
- **[Role-Based Access Control](/Security/role-based-access)**: Restrict who may lock or promote
