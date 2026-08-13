---
sidebar_position: 7
title: Google BigQuery
id: bigquery
description: "Connect Google BigQuery to DreamFactory and generate a secure REST API with full read and write access to your datasets"
keywords: [BigQuery, Google Cloud, database API, REST API, data warehouse, analytics, service account]
difficulty: "intermediate"
---

# Connecting Google BigQuery to DreamFactory

This guide walks you through connecting Google BigQuery to DreamFactory to auto-generate a secure REST API over your datasets. You'll learn how to:

- Authenticate with a Google Cloud service account and expose a BigQuery dataset as REST endpoints
- Read, filter, and aggregate table data
- Insert, update, and delete rows, and what BigQuery's lack of primary keys means for those calls
- Reach the same dataset from an AI agent through DreamFactory's MCP server

---

## Prerequisites

Before connecting BigQuery to DreamFactory, ensure you have:

- **A Google Cloud project** with the BigQuery API enabled and at least one dataset
- **A service account key** — a JSON key file for a service account with access to the dataset
- **DreamFactory Installation**: An up-and-running DreamFactory instance with access to the Admin application

:::tip[Least privilege]
Grant the service account only the roles it needs. `BigQuery Data Viewer` is enough for a read-only API; add `BigQuery Data Editor` only if you intend to write, and `BigQuery Job User` so it can run queries.
:::

---

## Connecting BigQuery

Sign into your DreamFactory instance, navigate to **API Generation & Connections**, and create a new service of type **BigQuery**.

### Configuration

| Field | Description |
| --- | --- |
| **Application Credentials JSON** | The **contents** of your service account key JSON file, pasted in full — not a path to it. |
| **Project ID** | Your Google Cloud project ID. |
| **Location** | The dataset location, for example `US` or `europe-west2`. See [BigQuery locations](https://cloud.google.com/bigquery/docs/locations). |
| **Auth Cache Store** | Which cache connection holds the auth token. Supported: `apc`, `array`, `database`, `file`, `memcached`, `redis`. |
| **Options** | Additional name/value parameters passed to the underlying BigQuery client: `authCacheOptions`, `authHttpHandler`, `httpHandler`, `retries`, `scopes`, `returnInt64AsObject`. |

Once saved, DreamFactory introspects the dataset and generates endpoints under `/api/v2/{service_name}/_table/{table_name}`, along with `_schema` endpoints describing the tables and columns.

---

## Reading data

Reads work as they do for any DreamFactory database service — see [Querying and Filtering Records](./querying-and-filtering) for the full syntax.

```bash
curl -X GET \
  "https://{instance}/api/v2/{service_name}/_table/{table_name}?limit=10" \
  -H "X-DreamFactory-API-Key: {api_key}"
```

Filtering, field selection, ordering, grouping, and aggregation (`SUM`, `COUNT`, `AVG`, `MIN`, `MAX`) are all supported.

---

## Writing data

BigQuery services support the full set of write verbs: `POST` to insert, `PUT`/`PATCH` to update, and `DELETE` to remove rows.

### Inserting

```bash
curl -X POST \
  "https://{instance}/api/v2/{service_name}/_table/{table_name}" \
  -H "X-DreamFactory-API-Key: {api_key}" \
  -H "Content-Type: application/json" \
  -d '{"resource": [{"id": 1, "name": "Example"}]}'
```

### Updating and deleting by filter

```bash
curl -X PATCH \
  "https://{instance}/api/v2/{service_name}/_table/{table_name}?filter=(status='pending')" \
  -H "X-DreamFactory-API-Key: {api_key}" \
  -H "Content-Type: application/json" \
  -d '{"status": "complete"}'
```

:::warning[BigQuery has no primary keys]
This is the one place a BigQuery API behaves differently from DreamFactory's other SQL connectors.

BigQuery does not enforce primary keys or uniqueness, so DreamFactory cannot infer an identifier column. Operations addressed by id — `PUT`, `PATCH`, `DELETE`, or `GET` on `/_table/{table_name}/{id}`, and calls using `?ids=` — require you to name the column explicitly with **`id_field`**:

```bash
curl -X DELETE \
  "https://{instance}/api/v2/{service_name}/_table/{table_name}/42?id_field=order_id" \
  -H "X-DreamFactory-API-Key: {api_key}"
```

Without it the request fails with:

> BigQuery has no primary keys; supply an id_field to update, delete or fetch by id, or use a filter.

Because uniqueness is not enforced, an id-addressed call may legitimately match zero rows or several. DreamFactory does not treat a mismatch between the number of ids sent and the number of rows affected as an error, so check the response rather than assuming a one-to-one result. Where you can, prefer filter-based calls, which express the intent directly.
:::

:::note[DML requires a WHERE clause]
BigQuery requires a predicate on `UPDATE` and `DELETE`. DreamFactory builds one from your `filter` or from the ids you supply, which means an unfiltered "update everything" call is rejected by BigQuery rather than silently rewriting the table.
:::

---

## Using BigQuery with AI agents

BigQuery services register in DreamFactory's **Database** service group, so the [MCP Server](/AI/mcp-server) discovers them automatically and exposes the standard database tools for them — schema exploration, querying, aggregation, and record management — prefixed with the service name.

---

## Next steps

- **[Querying and Filtering Records](./querying-and-filtering)**: The full filter, sort, and aggregation syntax
- **[Role-Based Access Control](/Security/role-based-access)**: Restrict which tables and verbs a key can reach
- **[MCP Server](/AI/mcp-server)**: Expose this dataset to AI agents
