# API Endpoints Reference

Complete reference for all DreamFactory REST API endpoints.

## Base URL

All endpoints use the base URL format:
```
https://{your-instance}/api/v2/{service_name}
```

## Authentication

Include your API key or session token in request headers:
```
X-DreamFactory-API-Key: your-api-key
X-DreamFactory-Session-Token: your-session-token
```

---

## Table Operations

### `GET /api/v2/_table/{table_name}`

Retrieve records from a table.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `filter` | string | Filter expression (see [Query Parameters](query-parameters.md)) |
| `limit` | integer | Maximum records to return |
| `offset` | integer | Number of records to skip |
| `order` | string | Sort order (e.g., `name ASC`) |
| `fields` | string | Comma-separated field names |
| `related` | string | Related tables to include |
| `include_count` | boolean | Include total record count |

**Example Request:**
```bash
curl -X GET "https://example.com/api/v2/db/_table/contacts?limit=10&order=name%20ASC" \
  -H "X-DreamFactory-API-Key: your-api-key"
```

**Example Response:**
```json
{
  "resource": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  ]
}
```

---

### `POST /api/v2/_table/{table_name}`

Create one or more records.

**Request Body:**
```json
{
  "resource": [
    {
      "name": "Jane Smith",
      "email": "jane@example.com"
    }
  ]
}
```

**Example Request:**
```bash
curl -X POST "https://example.com/api/v2/db/_table/contacts" \
  -H "X-DreamFactory-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"resource": [{"name": "Jane Smith", "email": "jane@example.com"}]}'
```

**Example Response:**
```json
{
  "resource": [
    {
      "id": 2
    }
  ]
}
```

---

### `PUT /api/v2/_table/{table_name}`

Replace records (full update). Requires primary key in each record.

**Request Body:**
```json
{
  "resource": [
    {
      "id": 1,
      "name": "John Updated",
      "email": "john.updated@example.com"
    }
  ]
}
```

**Example Request:**
```bash
curl -X PUT "https://example.com/api/v2/db/_table/contacts" \
  -H "X-DreamFactory-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"resource": [{"id": 1, "name": "John Updated", "email": "john.updated@example.com"}]}'
```

---

### `PATCH /api/v2/_table/{table_name}`

Partial update of records. Only specified fields are modified.

**Request Body:**
```json
{
  "resource": [
    {
      "id": 1,
      "email": "newemail@example.com"
    }
  ]
}
```

**Example Request:**
```bash
curl -X PATCH "https://example.com/api/v2/db/_table/contacts" \
  -H "X-DreamFactory-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"resource": [{"id": 1, "email": "newemail@example.com"}]}'
```

---

### `DELETE /api/v2/_table/{table_name}`

Delete records by IDs or filter.

**By IDs:**
```bash
curl -X DELETE "https://example.com/api/v2/db/_table/contacts?ids=1,2,3" \
  -H "X-DreamFactory-API-Key: your-api-key"
```

**By Filter:**
```bash
curl -X DELETE "https://example.com/api/v2/db/_table/contacts?filter=status%3D%27inactive%27" \
  -H "X-DreamFactory-API-Key: your-api-key"
```

---

## Schema Operations

### `GET /api/v2/_schema`

List all tables in the database.

**Example Request:**
```bash
curl -X GET "https://example.com/api/v2/db/_schema" \
  -H "X-DreamFactory-API-Key: your-api-key"
```

**Example Response:**
```json
{
  "resource": [
    {"name": "contacts"},
    {"name": "orders"},
    {"name": "products"}
  ]
}
```

---

### `GET /api/v2/_schema/{table_name}`

Get table structure and field definitions.

**Example Request:**
```bash
curl -X GET "https://example.com/api/v2/db/_schema/contacts" \
  -H "X-DreamFactory-API-Key: your-api-key"
```

**Example Response:**
```json
{
  "name": "contacts",
  "label": "Contacts",
  "field": [
    {
      "name": "id",
      "type": "integer",
      "db_type": "int",
      "is_primary_key": true,
      "auto_increment": true
    },
    {
      "name": "name",
      "type": "string",
      "db_type": "varchar(255)",
      "allow_null": false
    }
  ]
}
```

---

### `POST /api/v2/_schema`

Create a new table.

**Request Body:**
```json
{
  "resource": [
    {
      "name": "new_table",
      "label": "New Table",
      "field": [
        {
          "name": "id",
          "type": "id"
        },
        {
          "name": "name",
          "type": "string",
          "length": 255
        }
      ]
    }
  ]
}
```

---

### `PUT /api/v2/_schema/{table_name}`

Update table structure (add/modify columns).

---

### `DELETE /api/v2/_schema/{table_name}`

Drop a table from the database.

```bash
curl -X DELETE "https://example.com/api/v2/db/_schema/old_table" \
  -H "X-DreamFactory-API-Key: your-api-key"
```

---

## Stored Procedures

### `GET /api/v2/_proc/{procedure_name}`

Execute a stored procedure (no parameters or IN parameters only).

**Example Request:**
```bash
curl -X GET "https://example.com/api/v2/db/_proc/get_active_users" \
  -H "X-DreamFactory-API-Key: your-api-key"
```

---

### `POST /api/v2/_proc/{procedure_name}`

Execute a stored procedure with parameters.

**Request Body:**
```json
{
  "params": [
    {"name": "user_id", "value": 123},
    {"name": "status", "value": "active"}
  ]
}
```

**Example Request:**
```bash
curl -X POST "https://example.com/api/v2/db/_proc/update_user_status" \
  -H "X-DreamFactory-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"params": [{"name": "user_id", "value": 123}, {"name": "status", "value": "active"}]}'
```

---

## Stored Functions

### `GET /api/v2/_func/{function_name}`

Execute a stored function.

```bash
curl -X GET "https://example.com/api/v2/db/_func/calculate_total?order_id=456" \
  -H "X-DreamFactory-API-Key: your-api-key"
```

---

### `POST /api/v2/_func/{function_name}`

Execute a stored function with complex parameters.

---

## System APIs

### Service Management

#### `GET /api/v2/system/service`

List all configured services.

```bash
curl -X GET "https://example.com/api/v2/system/service" \
  -H "X-DreamFactory-API-Key: your-api-key"
```

#### `POST /api/v2/system/service`

Create a new service.

#### `PUT /api/v2/system/service/{id}`

Update a service configuration.

#### `DELETE /api/v2/system/service/{id}`

Delete a service.

---

### Role Management

#### `GET /api/v2/system/role`

List all roles.

```bash
curl -X GET "https://example.com/api/v2/system/role" \
  -H "X-DreamFactory-API-Key: your-api-key"
```

#### `POST /api/v2/system/role`

Create a new role.

**Request Body:**
```json
{
  "resource": [
    {
      "name": "read_only",
      "description": "Read-only access to database",
      "is_active": true
    }
  ]
}
```

#### `PUT /api/v2/system/role/{id}`

Update a role.

#### `DELETE /api/v2/system/role/{id}`

Delete a role.

---

### User Management

#### `GET /api/v2/system/user`

List all users (admin only).

#### `POST /api/v2/system/user`

Create a new user (admin only).

**Request Body:**
```json
{
  "resource": [
    {
      "email": "newuser@example.com",
      "password": "SecurePassword123!",
      "first_name": "New",
      "last_name": "User"
    }
  ]
}
```

#### `PUT /api/v2/system/user/{id}`

Update a user.

#### `DELETE /api/v2/system/user/{id}`

Delete a user.

---

### Application Management

#### `GET /api/v2/system/app`

List all applications.

#### `POST /api/v2/system/app`

Create a new application.

#### `PUT /api/v2/system/app/{id}`

Update an application.

#### `DELETE /api/v2/system/app/{id}`

Delete an application.

---

## User APIs

### Session Management

> ⚠️ **Admin vs regular user login use different endpoints.** See [Authentication](authentication.md) for the full breakdown.

#### `POST /api/v2/system/admin/session` — Admin Login

Requires `X-DreamFactory-API-Key` header and `Content-Type: application/json`.

```bash
curl -X POST "https://example.com/api/v2/system/admin/session" \
  -H "Content-Type: application/json" \
  -H "X-DreamFactory-API-Key: your-admin-app-api-key" \
  -d '{"email":"admin@example.com","password":"yourpassword"}'
```

#### `POST /api/v2/user/session` — Regular User Login

```bash
curl -X POST "https://example.com/api/v2/user/session" \
  -H "Content-Type: application/json" \
  -H "X-DreamFactory-API-Key: your-app-api-key" \
  -d '{"email":"user@example.com","password":"yourpassword"}'
```

**Response (both endpoints):**
```json
{
  "session_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "id": 1,
  "name": "Admin User",
  "email": "admin@example.com",
  "is_sys_admin": true,
  "token_expiry_date": "2026-02-19 19:45:18"
}
```

#### `GET /api/v2/system/admin/session`

Refresh token and get current session info.

#### `DELETE /api/v2/system/admin/session`

Logout and destroy session.

```bash
curl -X DELETE "https://example.com/api/v2/system/admin/session" \
  -H "X-DreamFactory-API-Key: your-api-key" \
  -H "X-DreamFactory-Session-Token: your-session-token"
```

---

### User Registration

#### `POST /api/v2/user/register`

Register a new user (if open registration is enabled).

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

---

### Password Management

#### `POST /api/v2/user/password`

Request password reset or change password.

**Request Reset Email:**
```json
{
  "email": "user@example.com"
}
```

**Change Password (authenticated):**
```json
{
  "old_password": "current-password",
  "new_password": "new-secure-password"
}
```

---

## Response Wrapper

All responses are wrapped in a `resource` array for consistency:

```json
{
  "resource": [
    { ... },
    { ... }
  ]
}
```

Single record responses may omit the wrapper depending on the request.

---

## See Also

- [Query Parameters](query-parameters.md) - Filter, sort, and paginate results
- [Error Codes](error-codes.md) - HTTP status codes and error handling
