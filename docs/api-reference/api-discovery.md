---
sidebar_position: 0
title: API Discovery & Spec Endpoints
id: api-discovery
description: How to discover all available APIs and retrieve OpenAPI specs for any service in DreamFactory. Essential for LLMs and programmatic clients.
keywords: [API discovery, OpenAPI spec, swagger, api_docs, _spec, service spec, LLM, programmatic]
---

# API Discovery & Spec Endpoints

DreamFactory exposes OpenAPI 3.0 specs for every service. This is the first thing an LLM or programmatic client should do — discover what's available and read the spec before making calls.

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
