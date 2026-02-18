---
sidebar_position: 1
title: System API
id: system-api
description: Complete reference for the DreamFactory System API — managing admins, users, apps, roles, services, and sessions. Derived from live OpenAPI spec at /api/v2/api_docs/system.
keywords: [system API, admin, user management, roles, services, apps, CORS, session, JWT]
---

# System API

> All endpoints below are prefixed with `/api/v2/system/`. Every request requires `X-DreamFactory-API-Key`. Most require `X-DreamFactory-Session-Token` as well. See [Authentication](authentication.md).

> **LLM tip:** Retrieve the live OpenAPI spec for this service at `GET /api/v2/api_docs/system` (DF 7.4.x) or `GET /api/v2/system/_spec` (DF 7.5+). Always check the live spec first — it's the ground truth. See [API Discovery](api-discovery.md).

---

## Session Management

### `POST /api/v2/system/admin/session` — Login

The correct admin login endpoint. Do NOT use `/api/v2/admin/session` or `/api/v2/user/session`.

**Required headers:** `Content-Type: application/json`, `X-DreamFactory-API-Key`

**Request schema:**
```json
{
  "email": "string (required)",
  "password": "string (required)",
  "duration": "integer (optional, session duration in minutes, 0 = until browser close)"
}
```

**Response schema:**
```json
{
  "session_token": "string — use as X-DreamFactory-Session-Token",
  "session_id": "string — same as session_token",
  "id": "integer",
  "email": "string",
  "first_name": "string",
  "last_name": "string",
  "name": "string",
  "is_sys_admin": "boolean",
  "role": "string",
  "last_login_date": "string",
  "token_expiry_date": "string",
  "apps": "array",
  "ticket": "string",
  "ticket_expiry": "string"
}
```

**Example:**
```bash
curl -s -X POST http://your-df-host/api/v2/system/admin/session \
  -H "Content-Type: application/json" \
  -H "X-DreamFactory-API-Key: YOUR_ADMIN_APP_API_KEY" \
  -d @login.json   # {"email":"admin@example.com","password":"yourpassword"}
```

> ⚠️ Shell quoting issues with `-d '...'` can silently break JSON parsing. Use `-d @file.json` for reliability.

### `GET /api/v2/system/admin/session` — Refresh / Check

Refreshes the current session token. Returns current user info.

### `PUT /api/v2/system/admin/session` — Refresh via token param

Pass `session_token` as query param or `X-DreamFactory-Session-Token` header to refresh a specific token.

### `DELETE /api/v2/system/admin/session` — Logout

Destroys the current session.

---

## Admin Management

### `GET /api/v2/system/admin`

List all system administrators.

**Query params:** `fields`, `related`, `ids`, `filter`, `limit`, `offset`, `order`, `include_count`

```bash
curl -s http://your-df-host/api/v2/system/admin \
  -H "X-DreamFactory-API-Key: KEY" \
  -H "X-DreamFactory-Session-Token: TOKEN"
```

### `POST /api/v2/system/admin`

Create one or more admins.

**Request schema:**
```json
{
  "resource": [{
    "name": "string (required)",
    "email": "string (required)",
    "first_name": "string",
    "last_name": "string",
    "username": "string",
    "phone": "string",
    "is_active": "boolean",
    "default_app_id": "integer"
  }]
}
```

### `PATCH /api/v2/system/admin/{id}` — Update Admin

### `DELETE /api/v2/system/admin/{id}` — Delete Admin

### `POST /api/v2/system/admin/password` — Change Password

### `GET/POST /api/v2/system/admin/profile` — Get/Update Profile

---

## User Management

Non-admin users. Same pattern as admin endpoints.

### `GET /api/v2/system/user`
### `POST /api/v2/system/user`

**Request schema:**
```json
{
  "resource": [{
    "name": "string (required)",
    "email": "string (required)",
    "first_name": "string",
    "last_name": "string",
    "is_active": "boolean",
    "phone": "string"
  }]
}
```

### `PATCH /api/v2/system/user/{id}`
### `DELETE /api/v2/system/user/{id}`

---

## App Management

Apps hold API keys. Each app gets its own `api_key` used in `X-DreamFactory-API-Key`.

### `GET /api/v2/system/app` — List Apps
### `POST /api/v2/system/app` — Create App

**Request schema:**
```json
{
  "resource": [{
    "name": "string (required)",
    "label": "string",
    "description": "string",
    "is_active": "boolean"
  }]
}
```

**Response includes `api_key`** — this is the value used in `X-DreamFactory-API-Key` for all requests.

### `PATCH /api/v2/system/app/{id}`
### `DELETE /api/v2/system/app/{id}`

---

## Service Management

Services are database connections, file storage, APIs, etc. Each gets a `name` (namespace) used in API paths like `/api/v2/{name}/_table/...`.

### `GET /api/v2/system/service` — List Services
### `POST /api/v2/system/service` — Create Service

**Request schema:**
```json
{
  "resource": [{
    "name": "string (required) — becomes URL namespace, lowercase alphanumeric",
    "label": "string (required) — display name",
    "type": "string (required) — service type id, e.g. 'mysql', 'sqlite', 'aws_s3'",
    "description": "string",
    "is_active": "boolean",
    "config": "object — type-specific configuration"
  }]
}
```

**Get available service types:**
```bash
curl -s http://your-df-host/api/v2/system/service_type \
  -H "X-DreamFactory-API-Key: KEY" \
  -H "X-DreamFactory-Session-Token: TOKEN"
```

### `PATCH /api/v2/system/service/{id}`
### `DELETE /api/v2/system/service/{id}`

---

## Role Management

Roles control what services and operations a user or app can access (RBAC).

### `GET /api/v2/system/role` — List Roles
### `POST /api/v2/system/role` — Create Role

**Request schema:**
```json
{
  "resource": [{
    "name": "string (required)",
    "description": "string",
    "is_active": "boolean"
  }]
}
```

### `PATCH /api/v2/system/role/{id}`
### `DELETE /api/v2/system/role/{id}`

---

## CORS Configuration

### `GET /api/v2/system/cors` — List CORS Rules
### `POST /api/v2/system/cors` — Create CORS Rule
### `PATCH /api/v2/system/cors/{id}`
### `DELETE /api/v2/system/cors/{id}`

---

## Other System Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v2/system/environment` | GET | System environment info (version, platform, etc.) |
| `/api/v2/system/event` | GET | List system events |
| `/api/v2/system/cache` | DELETE | Clear all cache |
| `/api/v2/system/cache/{service}` | DELETE | Clear cache for one service |
| `/api/v2/system/lookup` | GET/POST/PATCH/DELETE | Manage lookup keys (global variables) |
| `/api/v2/system/constant` | GET | Read-only system constants |
| `/api/v2/system/package` | GET/POST | Export/import configuration packages |
| `/api/v2/system/email_template` | GET/POST/PATCH/DELETE | Manage email templates |
| `/api/v2/system/custom` | GET/POST/PATCH/DELETE | Custom system settings |

---

## Common Query Parameters (all list endpoints)

| Parameter | Type | Description |
|-----------|------|-------------|
| `fields` | string | Comma-separated fields to return, `*` for all |
| `related` | string | Related resources to include |
| `ids` | string | Comma-separated IDs to retrieve |
| `filter` | string | SQL-like filter, e.g. `is_active=1` |
| `limit` | integer | Max records to return |
| `offset` | integer | Skip N records |
| `order` | string | Sort, e.g. `name ASC` |
| `include_count` | boolean | Include total count in meta |

---

## Response Envelope

All list responses are wrapped:
```json
{
  "resource": [ {...}, {...} ],
  "meta": { "count": 10 }
}
```

Single-record responses (by ID) return the object directly.
