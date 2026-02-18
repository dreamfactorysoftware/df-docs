---
sidebar_position: 2
title: Live API Examples
id: system-api-examples
description: Real curl examples with real responses from a live DreamFactory 7.4.2 instance. Covers auth, service management, data queries, and API discovery.
keywords: [curl examples, live API, DreamFactory examples, data query, service creation, authentication]
---

# Live API Examples

> All examples verified against a live DreamFactory 7.4.2 instance. Responses are real, trimmed for brevity.

> ⚠️ **Shell quoting gotcha:** Using `-d '{"email":...}'` can silently fail on some shells — the JSON body arrives but DF doesn't parse it. Always use `-d @file.json` for reliability.

---

## Setup

```bash
APIKEY="your-admin-app-api-key"

# Write payload to file — avoids shell quoting issues
cat > /tmp/login.json << 'EOF'
{"email":"admin@example.com","password":"yourpassword"}
EOF

TOKEN=$(curl -s -X POST http://your-df-host/api/v2/system/admin/session \
  -H "Content-Type: application/json" \
  -H "X-DreamFactory-API-Key: $APIKEY" \
  -d @/tmp/login.json | python3 -c "import sys,json; print(json.load(sys.stdin)['session_token'])")
```

---

## System Info

### Get DF Version and Environment

```bash
curl -s http://your-df-host/api/v2/system/environment \
  -H "X-DreamFactory-API-Key: $APIKEY" \
  -H "X-DreamFactory-Session-Token: $TOKEN"
```

**Real response (trimmed):**
```json
{
  "platform": {
    "version": "7.4.2",
    "is_hosted": false
  }
}
```

---

## Service Management

### List All Services

```bash
curl -s "http://your-df-host/api/v2/system/service?fields=id,name,type,label" \
  -H "X-DreamFactory-API-Key: $APIKEY" \
  -H "X-DreamFactory-Session-Token: $TOKEN"
```

**Real response:**
```json
{
  "resource": [
    {"id": 1, "name": "system",   "type": "system",      "label": "System Management"},
    {"id": 2, "name": "api_docs", "type": "swagger",     "label": "Live API Docs"},
    {"id": 3, "name": "files",    "type": "local_file",  "label": "Local File Storage"},
    {"id": 4, "name": "logs",     "type": "local_file",  "label": "Local Log Storage"},
    {"id": 5, "name": "db",       "type": "sqlite",      "label": "Local SQL Database"},
    {"id": 6, "name": "email",    "type": "local_email", "label": "Local Email Service"},
    {"id": 7, "name": "user",     "type": "user",        "label": "User Management"}
  ]
}
```

The `name` field becomes the URL namespace: `/api/v2/{name}/`.

### List All Available Service Types

```bash
curl -s "http://your-df-host/api/v2/system/service_type?fields=name,label,group" \
  -H "X-DreamFactory-API-Key: $APIKEY" \
  -H "X-DreamFactory-Session-Token: $TOKEN"
```

**Real response — use `name` as the `type` field when creating services:**

| name | label | group |
|------|-------|-------|
| `mysql` | MySQL | Database |
| `pgsql` | PostgreSQL | Database |
| `sqlite` | SQLite | Database |
| `mssql` | MS SQL Server | Database |
| `alloydb` | AlloyDB | Database |
| `aws_dynamodb` | AWS DynamoDB | Database |
| `aws_redshift_db` | AWS Redshift | Database |
| `cassandra` | Cassandra | Database |
| `couchdb` | CouchDB | Database |
| `azure_documentdb` | Azure DocumentDB | Database |
| `azure_table` | Azure Table Storage | Database |
| `firebird` | Firebird | Database |
| `aws_s3` | AWS S3 | File |
| `azure_blob` | Azure Blob Storage | File |
| `local_file` | Local File Storage | File |
| `ftp_file` | FTP File Storage | File |
| `sftp_file` | SFTP File Storage | File |
| `webdav_file` | WebDAV File Storage | File |
| `openstack_object_storage` | OpenStack Object Storage | File |
| `rackspace_cloud_files` | Rackspace Cloud Files | File |
| `rws` | HTTP Service | Remote Service |
| `mcp` | MCP Server Service | MCP |
| `aws_ses` | AWS SES | Email |
| `local_email` | Local Email Service | Email |
| `mailgun_email` | Mailgun | Email |
| `smtp_email` | SMTP | Email |
| `aws_sns` | AWS SNS | Notification |
| `oauth_github` | GitHub OAuth | OAuth |
| `oauth_google` | Google OAuth | OAuth |
| `oauth_facebook` | Facebook OAuth | OAuth |
| `oauth_microsoft-live` | Microsoft Live OAuth | OAuth |
| `cache_redis` | Redis | Cache |
| `cache_memcached` | Memcached | Cache |
| `amqp` | AMQP Client | IoT |
| `mqtt` | MQTT Client | IoT |

### Create a MySQL Service

```bash
cat > /tmp/mysql_svc.json << 'EOF'
{
  "resource": [{
    "name": "mysql",
    "label": "MySQL Database",
    "type": "mysql",
    "is_active": true,
    "config": {
      "host": "mysql",
      "port": 3306,
      "database": "mydb",
      "username": "myuser",
      "password": "mypassword"
    }
  }]
}
EOF

curl -s -X POST http://your-df-host/api/v2/system/service \
  -H "Content-Type: application/json" \
  -H "X-DreamFactory-API-Key: $APIKEY" \
  -H "X-DreamFactory-Session-Token: $TOKEN" \
  -d @/tmp/mysql_svc.json
```

**Real response:**
```json
{"resource": [{"id": 12}]}
```

Returns just the new service ID. Use it for updates/deletes: `PATCH /api/v2/system/service/12`.

### Create a PostgreSQL Service

```bash
cat > /tmp/pgsql_svc.json << 'EOF'
{
  "resource": [{
    "name": "world",
    "label": "World (Sample Data)",
    "type": "pgsql",
    "is_active": true,
    "config": {
      "host": "example_data",
      "port": 5432,
      "database": "world",
      "username": "postgres",
      "password": "root_pw"
    }
  }]
}
EOF

curl -s -X POST http://your-df-host/api/v2/system/service \
  -H "Content-Type: application/json" \
  -H "X-DreamFactory-API-Key: $APIKEY" \
  -H "X-DreamFactory-Session-Token: $TOKEN" \
  -d @/tmp/pgsql_svc.json
```

### Delete a Service

```bash
curl -s -X DELETE "http://your-df-host/api/v2/system/service?ids=12" \
  -H "X-DreamFactory-API-Key: $APIKEY" \
  -H "X-DreamFactory-Session-Token: $TOKEN"
```

---

## App Management

### List Apps (includes API keys)

```bash
curl -s "http://your-df-host/api/v2/system/app?fields=id,name,api_key,is_active" \
  -H "X-DreamFactory-API-Key: $APIKEY" \
  -H "X-DreamFactory-Session-Token: $TOKEN"
```

**Real response:**
```json
{
  "resource": [
    {"id": 1, "name": "admin",        "api_key": "6498a8ad...", "is_active": true},
    {"id": 2, "name": "api_docs",     "api_key": "36fda24f...", "is_active": true},
    {"id": 3, "name": "file_manager", "api_key": "b5cb82af...", "is_active": true}
  ]
}
```

The `admin` app's `api_key` is the one to use for `X-DreamFactory-API-Key` in admin operations.

---

## API Discovery

### Get OpenAPI Spec for a Service (DF 7.4.x)

```bash
curl -s http://your-df-host/api/v2/api_docs/world \
  -H "X-DreamFactory-API-Key: $APIKEY" \
  -H "X-DreamFactory-Session-Token: $TOKEN"
```

Returns a full OpenAPI 3.0 spec. The `world` service has 14 paths covering `_schema` and `_table` operations.

First 5 paths:
```
GET/POST/PUT/PATCH  /_schema
GET/POST/PUT/PATCH/DELETE  /_schema/{table_name}
GET/POST/PUT/PATCH/DELETE  /_schema/{table_name}/_field
GET  /_schema/{table_name}/_related
GET/POST/PUT/PATCH/DELETE  /_table/{table_name}
```

### Get Spec for System API

```bash
curl -s http://your-df-host/api/v2/api_docs/system \
  -H "X-DreamFactory-API-Key: $APIKEY" \
  -H "X-DreamFactory-Session-Token: $TOKEN"
```

Returns 32 paths covering all system management operations.

---

## Data Queries

All examples use the `world` PostgreSQL service (3 tables: `country`, `city`, `countrylanguage`).

### List Tables

```bash
curl -s "http://your-df-host/api/v2/world/_schema?fields=name" \
  -H "X-DreamFactory-API-Key: $APIKEY" \
  -H "X-DreamFactory-Session-Token: $TOKEN"
```

**Real response:**
```json
{
  "resource": [
    {"name": "city"},
    {"name": "country"},
    {"name": "countrylanguage"}
  ]
}
```

### Basic Query with Field Selection

```bash
curl -s "http://your-df-host/api/v2/world/_table/country?limit=3&fields=Code,Name,Continent,Population" \
  -H "X-DreamFactory-API-Key: $APIKEY" \
  -H "X-DreamFactory-Session-Token: $TOKEN"
```

**Real response:**
```json
{
  "resource": [
    {"code": "AFG", "name": "Afghanistan",          "continent": "Asia",          "population": 22720000},
    {"code": "NLD", "name": "Netherlands",           "continent": "Europe",        "population": 15864000},
    {"code": "ANT", "name": "Netherlands Antilles",  "continent": "North America", "population": 217000}
  ]
}
```

### Filter + Sort + Limit

```bash
curl -s "http://your-df-host/api/v2/world/_table/country?filter=Continent%3D'Asia'&order=Population%20DESC&limit=5&fields=Name,Continent,Population,LifeExpectancy" \
  -H "X-DreamFactory-API-Key: $APIKEY" \
  -H "X-DreamFactory-Session-Token: $TOKEN"
```

**Real response:**
```json
{
  "resource": [
    {"name": "China",       "continent": "Asia", "population": 1277558000, "lifeexpectancy": 71.4},
    {"name": "India",       "continent": "Asia", "population": 1013662000, "lifeexpectancy": 62.5},
    {"name": "Indonesia",   "continent": "Asia", "population": 212107000,  "lifeexpectancy": 68.0},
    {"name": "Pakistan",    "continent": "Asia", "population": 156483000,  "lifeexpectancy": 61.1},
    {"name": "Bangladesh",  "continent": "Asia", "population": 129155000,  "lifeexpectancy": 60.2}
  ]
}
```

Filter syntax: `field=value`, `field>value`, `field LIKE '%pattern%'`, `field IN (a,b,c)`. URL-encode special chars.

### Get Single Record by ID

```bash
curl -s "http://your-df-host/api/v2/world/_table/country/USA?fields=Name,Code,Continent,Population,LifeExpectancy" \
  -H "X-DreamFactory-API-Key: $APIKEY" \
  -H "X-DreamFactory-Session-Token: $TOKEN"
```

**Real response:**
```json
{
  "name": "United States",
  "code": "USA",
  "continent": "North America",
  "population": 278357000,
  "lifeexpectancy": 77.1
}
```

Single-record response is unwrapped (no `resource` array).

### Create a Record

```bash
cat > /tmp/new_record.json << 'EOF'
{
  "resource": [{
    "name": "John Doe",
    "email": "john@example.com"
  }]
}
EOF

curl -s -X POST http://your-df-host/api/v2/myservice/_table/contacts \
  -H "Content-Type: application/json" \
  -H "X-DreamFactory-API-Key: $APIKEY" \
  -H "X-DreamFactory-Session-Token: $TOKEN" \
  -d @/tmp/new_record.json
```

**Response:** `{"resource": [{"id": 42}]}` — returns the new record's primary key.

### Update a Record

```bash
cat > /tmp/update.json << 'EOF'
{"email": "john.updated@example.com"}
EOF

curl -s -X PATCH http://your-df-host/api/v2/myservice/_table/contacts/42 \
  -H "Content-Type: application/json" \
  -H "X-DreamFactory-API-Key: $APIKEY" \
  -H "X-DreamFactory-Session-Token: $TOKEN" \
  -d @/tmp/update.json
```

### Delete Records

```bash
# By ID
curl -s -X DELETE "http://your-df-host/api/v2/myservice/_table/contacts?ids=1,2,3" \
  -H "X-DreamFactory-API-Key: $APIKEY" \
  -H "X-DreamFactory-Session-Token: $TOKEN"

# By filter
curl -s -X DELETE "http://your-df-host/api/v2/myservice/_table/contacts?filter=status%3D'inactive'" \
  -H "X-DreamFactory-API-Key: $APIKEY" \
  -H "X-DreamFactory-Session-Token: $TOKEN"
```

---

## Query Parameter Reference

| Param | Example | Description |
|-------|---------|-------------|
| `fields` | `fields=id,name,email` | Return only these fields. `*` = all. |
| `filter` | `filter=status='active'` | SQL-like filter. URL-encode `=`, spaces, quotes. |
| `order` | `order=name ASC` | Sort field + direction. URL-encode space. |
| `limit` | `limit=25` | Max records. Default varies by config. |
| `offset` | `offset=50` | Skip N records (for pagination). |
| `include_count` | `include_count=true` | Add `meta.count` with total matching records. |
| `related` | `related=city_by_CountryCode` | Join related table. Name format: `{table}_by_{fk_field}`. |
| `ids` | `ids=1,2,3` | Fetch specific records by primary key. |

---

## Notes for LLMs

1. **Always use `-d @file.json`** for POST/PATCH bodies. Inline `-d '...'` has shell quoting edge cases that silently drop the body.
2. **Token expires in 24h.** Re-POST to `/api/v2/system/admin/session` to refresh.
3. **Field names are lowercased** in responses even if the DB uses uppercase (e.g., `Code` → `code`).
4. **Single vs list responses:** By-ID requests return the object directly. List requests return `{"resource": [...]}`.
5. **Check the live spec first:** `GET /api/v2/api_docs/{service_name}` gives you the exact schema for any service before you start querying.
