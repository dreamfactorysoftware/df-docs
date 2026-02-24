---
sidebar_position: 0
title: API Discovery & Spec Endpoints
id: api-discovery
description: How to discover all available APIs and retrieve OpenAPI specs for any service in DreamFactory. Essential for LLMs and programmatic clients.
keywords: [API discovery, OpenAPI spec, swagger, api_docs, _spec, service spec, LLM, programmatic]
---

# API Discovery & Spec Endpoints

DreamFactory exposes OpenAPI 3.0 specs for every service. This is the first thing an LLM or programmatic client should do — discover what's available and read the spec before making calls. If you want to [generate a database-backed REST API](/api-generation-and-connections/api-types/database/generating-a-database-backed-api), DreamFactory can auto-create all endpoints from your existing schema.

---

## Step 1: List All Services

```bash
curl -s http://your-df-host/api/v2/system/service \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "X-DreamFactory-Session-Token: YOUR_TOKEN" \
  | python3 -c "
import sys, json
for s in json.load(sys.stdin)['resource']:
    print(s['name'], '-', s['type'], '-', s['label'])
"
```

This gives you every service `name` — used as the URL namespace in `/api/v2/{name}/`.

---

## Step 2: Get the OpenAPI Spec for a Service

### DF 7.5+ (newer versions)

Each service exposes its own spec directly:

```
GET /api/v2/{service_name}/_spec
```

```bash
curl -s http://your-df-host/api/v2/system/_spec \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "X-DreamFactory-Session-Token: YOUR_TOKEN"
```

### DF 7.4.x and earlier

Use the `api_docs` service instead:

```
GET /api/v2/api_docs/{service_name}
```

```bash
# Full system API spec
curl -s http://your-df-host/api/v2/api_docs/system \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "X-DreamFactory-Session-Token: YOUR_TOKEN"

# Spec for a database service named 'mysql'
curl -s http://your-df-host/api/v2/api_docs/mysql \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "X-DreamFactory-Session-Token: YOUR_TOKEN"
```

### Get all specs at once

```bash
# Full combined spec for all services
curl -s http://your-df-host/api/v2/api_docs \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "X-DreamFactory-Session-Token: YOUR_TOKEN"
```

---

## Step 3: Extract Paths from Spec

```python
import requests, json

APIKEY = "your-api-key"
TOKEN = "your-session-token"
HOST = "http://your-df-host"

# Get spec for a service
spec = requests.get(
    f"{HOST}/api/v2/api_docs/system",
    headers={
        "X-DreamFactory-API-Key": APIKEY,
        "X-DreamFactory-Session-Token": TOKEN,
    }
).json()

# List all endpoints
for path, methods in sorted(spec["paths"].items()):
    for method in methods:
        if method in ["get", "post", "put", "patch", "delete"]:
            summary = methods[method].get("summary", "")
            print(f"{method.upper():7} /api/v2{path}  —  {summary}")
```

---

## What the Spec Tells You

Each path entry includes:
- **summary** — one-line description
- **description** — full explanation
- **parameters** — query params with types and descriptions
- **requestBody** — `$ref` to schema in `components/schemas`
- **responses** — response schemas

The `components/schemas` section has the full field definitions for every request and response object.

---

## Check DF Version

```bash
curl -s http://your-df-host/api/v2/system/environment \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "X-DreamFactory-Session-Token: YOUR_TOKEN" \
  | python3 -c "import sys,json; e=json.load(sys.stdin); print(e['platform']['version'])"
```

- **7.5+**: Use `GET /api/v2/{service}/_spec`
- **7.4.x and earlier**: Use `GET /api/v2/api_docs/{service}`

---

## Available Service Types

To see all service types you can create:

```bash
curl -s http://your-df-host/api/v2/system/service_type?fields=name,label,group \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "X-DreamFactory-Session-Token: YOUR_TOKEN"
```

This returns the valid `type` values for `POST /api/v2/system/service`.

---

## Retrieving OpenAPI Specs — Code Examples

Once you know a service name, you can retrieve its OpenAPI spec programmatically. The examples below work for both LLM agents and developer tooling.

### cURL

```bash
# DF 7.5+ — fetch the spec for a service named 'mysql'
curl -s http://your-df-host/api/v2/mysql/_spec \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "X-DreamFactory-Session-Token: YOUR_TOKEN"

# DF 7.4.x and earlier — use api_docs
curl -s http://your-df-host/api/v2/api_docs/mysql \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "X-DreamFactory-Session-Token: YOUR_TOKEN"
```

### JavaScript (fetch)

```javascript
const DF_HOST = 'http://your-df-host';
const SERVICE = 'mysql';
const headers = {
  'X-DreamFactory-API-Key': 'YOUR_API_KEY',
  'X-DreamFactory-Session-Token': 'YOUR_TOKEN',
};

// DF 7.5+ endpoint
const response = await fetch(`${DF_HOST}/api/v2/${SERVICE}/_spec`, { headers });
const spec = await response.json();

// Print all available paths
Object.keys(spec.paths).forEach(path => console.log(path));
```

Both approaches return an OpenAPI 3.0 document you can feed directly to an LLM context window, an API client generator, or a documentation tool.

---

## REST vs. GraphQL Introspection

DreamFactory exposes a REST-based discovery mechanism (OpenAPI spec endpoints) and, for GraphQL services, the standard GraphQL introspection query. Here is how they compare:

| Feature | DreamFactory OpenAPI (`/_spec`) | GraphQL Introspection (`__schema`) |
|---|---|---|
| **Format** | OpenAPI 3.0 JSON | GraphQL SDL / JSON |
| **Endpoint** | `GET /api/v2/{service}/_spec` | `POST /api/v2/{service}` with `{"query": "{ __schema { types { name } } }"}` |
| **Auth required** | Yes — API key + session token | Yes — same headers |
| **Covers** | All REST paths, parameters, schemas | Types, fields, resolvers |
| **LLM-friendly** | High — maps directly to HTTP calls | Moderate — requires GraphQL query construction |
| **Use when** | Discovering database, file, or scripted REST services | Working with a DreamFactory GraphQL service |

For most DreamFactory integrations, the OpenAPI `/_spec` endpoint is the preferred discovery mechanism. Use GraphQL introspection only when your DreamFactory service is explicitly of type `graphql` and your client speaks GraphQL natively.

---

## Troubleshooting

### Spec endpoint returns 403

A 403 response means the API key or session token you are using is bound to a role that does not have access to the spec endpoint for that service.

**Fix**: In the DreamFactory admin panel, open the role attached to your API key, navigate to **Access Overview**, and ensure the target service is listed with at least GET access on the `_spec` component (or `*` for all components). See [Role-Based Access Control](/Security/role-based-access) for details.

### Spec shows empty `paths` object

An OpenAPI document with `paths: {}` means the service was found but has no routable endpoints. This usually means the service is not fully activated or its underlying connection is broken.

**Fix**: Navigate to **API Generation & Connections** in the admin panel, open the service, and verify the connection test passes. For database services, confirm the database is reachable and credentials are correct.

### Endpoint not found (404)

A 404 on the spec URL usually means the service name in the URL does not match any configured service.

**Fix**: Run the [Step 1 listing call](#step-1-list-all-services) to retrieve exact service names, then substitute the correct `name` value (case-sensitive) into your spec URL.
