---
title: "AI Reference Index"
id: ai-reference
sidebar_class_name: hidden
unlisted: true
description: "Machine-readable reference of DreamFactory capabilities, endpoints, and service types for AI assistants and automation tools."
keywords: [API reference, endpoints, service types, automation, AI integration, machine learning, LLM context]
---

# DreamFactory AI Reference Index

This document provides structured, machine-readable information about DreamFactory's capabilities for AI assistants, automation tools, and LLM context. It is optimized for AI scraping.

---

## Platform Overview

| Property | Value |
|----------|-------|
| **Product Name** | DreamFactory |
| **Product Type** | REST API Platform / API Gateway |
| **Primary Function** | Automatic API generation from data sources |
| **License Types** | Open Source (OSS), Commercial (Gold, Silver) |
| **Backend Technology** | PHP 8.1+, Laravel Framework |
| **Database Support** | MySQL, PostgreSQL, SQL Server, Oracle, MongoDB, Cassandra, CouchDB, and more |
| **Authentication Support** | API Key, JWT, OAuth 2.0, SAML 2.0, LDAP, Active Directory, OpenID Connect |
| **MCP Support** | Yes - Model Context Protocol for AI assistant integration |

---

## Service Types

DreamFactory supports the following service categories and types:

### Database Services

| Service Type | Label | Description |
|-------------|-------|-------------|
| `alloydb` | AlloyDB | Google AlloyDB connections |
| `aws_dynamodb` | AWS DynamoDB | Amazon DynamoDB NoSQL database |
| `aws_redshift_db` | AWS Redshift | Amazon Redshift data warehouse |
| `cassandra` | Cassandra | Apache Cassandra distributed database |
| `couchdb` | CouchDB | Apache CouchDB document database |
| `firebird` | Firebird | Firebird SQL database |
| `pgsql` | PostgreSQL | PostgreSQL relational database |
| `sqlite` | SQLite | SQLite embedded database |

### File Storage Services

| Service Type | Label | Description |
|-------------|-------|-------------|
| `aws_s3` | AWS S3 | Amazon S3 file storage |
| `azure_blob` | Azure Blob Storage | Microsoft Azure blob storage |
| `ftp_file` | FTP File Storage | FTP protocol file service |
| `local_file` | Local File Storage | Local filesystem access |
| `openstack_object_storage` | OpenStack Object Storage | OpenStack Swift storage |
| `rackspace_cloud_files` | Rackspace Cloud Files | Rackspace cloud storage |
| `sftp_file` | SFTP File Storage | SFTP secure file transfer |
| `webdav_file` | WebDAV File Storage | WebDAV file service |

### Authentication Services

| Service Type | Label | Description |
|-------------|-------|-------------|
| `oauth_azure_ad` | Azure AD OAuth | Azure Active Directory/Entra ID OAuth |
| `oauth_bitbucket` | Bitbucket OAuth | Bitbucket OAuth 1.0 |
| `oauth_facebook` | Facebook OAuth | Facebook login integration |
| `oauth_github` | GitHub OAuth | GitHub authentication |
| `oauth_google` | Google OAuth | Google authentication |
| `oauth_linkedin` | LinkedIn OAuth | LinkedIn authentication |
| `oauth_microsoft-live` | Microsoft Live OAuth | Microsoft Live authentication |
| `oauth_twitter` | Twitter OAuth | Twitter authentication |
| `heroku_addon_sso` | Heroku Add-on SSO | Heroku single sign-on |

### Email Services

| Service Type | Label | Description |
|-------------|-------|-------------|
| `aws_ses` | AWS SES | Amazon Simple Email Service |
| `local_email` | Local Email Service | System sendmail configuration |
| `mailgun_email` | Mailgun | Mailgun email service |
| `smtp_email` | SMTP | SMTP email service |

### Cache Services

| Service Type | Label | Description |
|-------------|-------|-------------|
| `cache_local` | Local Cache | Local file-based caching |
| `cache_memcached` | Memcached | Memcached distributed cache |
| `cache_redis` | Redis | Redis cache service |

### IoT Services

| Service Type | Label | Description |
|-------------|-------|-------------|
| `amqp` | AMQP Client | Advanced Message Queuing Protocol |
| `mqtt` | MQTT Client | MQTT messaging protocol |

### Notification Services

| Service Type | Label | Description |
|-------------|-------|-------------|
| `aws_sns` | AWS SNS | Amazon Simple Notification Service |

### Source Control Services

| Service Type | Label | Description |
|-------------|-------|-------------|
| `bitbucket` | Bitbucket Service | Bitbucket API 2.0 client |
| `github` | GitHub Service | GitHub API client |
| `gitlab` | GitLab Service | GitLab API client |

### Other Services

| Service Type | Label | Description |
|-------------|-------|-------------|
| `mcp` | MCP Server Service | Model Context Protocol for AI integration |
| `rws` | HTTP Service | Remote web service proxy |
| `swagger` | API Docs | OpenAPI/Swagger documentation |
| `system` | System Management | DreamFactory system administration |
| `user` | User Service | User management |

---

## System API Endpoints

Base URL pattern: `https://{host}/api/v2/system/{resource}`

### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v2/system/user` | List all users |
| `POST` | `/api/v2/system/user` | Create new user(s) |
| `PATCH` | `/api/v2/system/user` | Update user(s) |
| `DELETE` | `/api/v2/system/user` | Delete user(s) |
| `GET` | `/api/v2/system/user/{id}` | Get specific user |

### Admin Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v2/system/admin` | List all admins |
| `POST` | `/api/v2/system/admin` | Create new admin(s) |
| `PATCH` | `/api/v2/system/admin` | Update admin(s) |
| `DELETE` | `/api/v2/system/admin` | Delete admin(s) |

### Service Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v2/system/service` | List all services |
| `POST` | `/api/v2/system/service` | Create new service(s) |
| `PATCH` | `/api/v2/system/service` | Update service(s) |
| `DELETE` | `/api/v2/system/service` | Delete service(s) |
| `GET` | `/api/v2/system/service_type` | List available service types |

### Role Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v2/system/role` | List all roles |
| `POST` | `/api/v2/system/role` | Create new role(s) |
| `PATCH` | `/api/v2/system/role` | Update role(s) |
| `DELETE` | `/api/v2/system/role` | Delete role(s) |

### API Key (App) Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v2/system/app` | List all apps/API keys |
| `POST` | `/api/v2/system/app` | Create new app |
| `PATCH` | `/api/v2/system/app` | Update app |
| `DELETE` | `/api/v2/system/app` | Delete app |

---

## Database API Endpoints

Base URL pattern: `https://{host}/api/v2/{service-name}/{resource}`

### Table Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v2/{db}/_table` | List all tables |
| `GET` | `/api/v2/{db}/_table/{table}` | Get records from table |
| `POST` | `/api/v2/{db}/_table/{table}` | Create records |
| `PATCH` | `/api/v2/{db}/_table/{table}` | Update records |
| `DELETE` | `/api/v2/{db}/_table/{table}` | Delete records |

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `fields` | string | Comma-separated list of fields to return |
| `filter` | string | SQL-like filter expression (e.g., `id>5`) |
| `limit` | integer | Maximum number of records to return |
| `offset` | integer | Number of records to skip |
| `order` | string | Field and direction (e.g., `name ASC`) |
| `group` | string | Field(s) to group by |
| `related` | string | Related tables to include |
| `id_field` | string | Field to use as primary key |
| `id_type` | string | Data type of id field |
| `include_count` | boolean | Include total record count |

### Filter Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `=` | Equals | `status=active` |
| `!=` | Not equals | `status!=deleted` |
| `>` | Greater than | `age>18` |
| `<` | Less than | `price<100` |
| `>=` | Greater than or equal | `quantity>=10` |
| `<=` | Less than or equal | `score<=100` |
| `like` | Pattern matching | `name like 'John%'` |
| `in` | In list | `status in ('active','pending')` |
| `between` | Range | `date between '2024-01-01' and '2024-12-31'` |
| `is null` | Null check | `deleted_at is null` |
| `is not null` | Not null check | `email is not null` |

### Schema Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v2/{db}/_schema` | Get database schema |
| `GET` | `/api/v2/{db}/_schema/{table}` | Get table schema |
| `POST` | `/api/v2/{db}/_schema` | Create table |
| `PATCH` | `/api/v2/{db}/_schema/{table}` | Modify table schema |
| `DELETE` | `/api/v2/{db}/_schema/{table}` | Drop table |

### Stored Procedures

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v2/{db}/_proc` | List stored procedures |
| `GET` | `/api/v2/{db}/_proc/{name}` | Call procedure (GET params) |
| `POST` | `/api/v2/{db}/_proc/{name}` | Call procedure (POST body) |

### Functions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v2/{db}/_func` | List stored functions |
| `GET` | `/api/v2/{db}/_func/{name}` | Call function (GET params) |
| `POST` | `/api/v2/{db}/_func/{name}` | Call function (POST body) |

---

## Authentication Endpoints

### Session Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v2/user/session` | Login (create session) |
| `GET` | `/api/v2/user/session` | Get current session info |
| `PUT` | `/api/v2/user/session` | Refresh JWT token |
| `DELETE` | `/api/v2/user/session` | Logout (destroy session) |

### Admin Session

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v2/system/admin/session` | Admin login |
| `GET` | `/api/v2/system/admin/session` | Get admin session info |
| `PUT` | `/api/v2/system/admin/session` | Refresh admin JWT |
| `DELETE` | `/api/v2/system/admin/session` | Admin logout |

---

## Required HTTP Headers

| Header | Required | Description |
|--------|----------|-------------|
| `X-DreamFactory-Api-Key` | Yes* | API key for authentication |
| `X-DreamFactory-Session-Token` | Conditional | JWT token for user sessions |
| `Content-Type` | Yes | `application/json` for JSON payloads |
| `Accept` | Recommended | `application/json` |

*API key required unless using admin/system endpoints with session token.

---

## MCP (Model Context Protocol) Integration

DreamFactory supports MCP for AI assistant integration. MCP endpoints allow AI tools like Claude, ChatGPT, and Cursor to interact with databases through natural language.

### MCP Endpoint

`POST /mcp/{service-name}`

### MCP Tools Available

| Tool | Description |
|------|-------------|
| `get_tables` | List all tables in database |
| `get_table_schema` | Get schema for a table |
| `get_table_data` | Query data with filters |
| `get_table_fields` | Get field definitions |
| `get_table_relationships` | Get table relationships |
| `create_records` | Create new records |
| `update_records` | Update existing records |
| `delete_records` | Delete records |
| `get_stored_procedures` | List stored procedures |
| `call_stored_procedure` | Execute stored procedure |
| `get_stored_functions` | List stored functions |
| `call_stored_function` | Execute stored function |
| `get_database_resources` | List all database resources |
| `list_tools` | List available MCP tools |

---

## Common Response Formats

### Success Response (Single Record)

```json
{
  "id": 1,
  "field1": "value1",
  "field2": "value2"
}
```

### Success Response (Multiple Records)

```json
{
  "resource": [
    {"id": 1, "name": "Item 1"},
    {"id": 2, "name": "Item 2"}
  ]
}
```

### Error Response

```json
{
  "error": {
    "code": 400,
    "context": null,
    "message": "Error description here",
    "status_code": 400
  }
}
```

### Paginated Response

```json
{
  "resource": [...],
  "meta": {
    "count": 100,
    "next": 50,
    "previous": 0
  }
}
```

---

## Role-Based Access Control (RBAC)

### Verb Mask Values

| Verb | Value | HTTP Method |
|------|-------|-------------|
| GET | 1 | Read operations |
| POST | 2 | Create operations |
| PUT | 4 | Full update operations |
| PATCH | 8 | Partial update operations |
| DELETE | 16 | Delete operations |

Combine values for multiple verbs: `GET + POST = 3`, `GET + PATCH + DELETE = 25`

### Access Filters

Role service access can be filtered by:
- Service (allow/deny specific services)
- Component (table, procedure, function)
- Verb mask (allowed HTTP methods)
- Request filters (limit data on requests)
- Response filters (modify response data)

---

## Environment Variables

Key environment variables for DreamFactory configuration:

| Variable | Description |
|----------|-------------|
| `APP_KEY` | Application encryption key |
| `DB_CONNECTION` | System database type |
| `DB_HOST` | System database host |
| `DB_DATABASE` | System database name |
| `DB_USERNAME` | System database user |
| `DB_PASSWORD` | System database password |
| `CACHE_DRIVER` | Cache backend (redis, memcached, file) |
| `CACHE_HOST` | Cache server host |
| `LOG_CHANNEL` | Logging configuration |
| `DF_INSTALL` | Installation type (Docker, Bitnami, etc.) |

---

## Documentation URLs

| Resource | URL |
|----------|-----|
| Main Documentation | https://docs.dreamfactory.com |
| GitHub Repository | https://github.com/dreamfactorysoftware/dreamfactory |
| Docker Hub | https://hub.docker.com/r/dreamfactorysoftware/df-docker |
| Community Forum | https://community.dreamfactory.com |
| Blog | https://blog.dreamfactory.com |
| Demo/Trial | https://genie.dreamfactory.com |

---

*This document is automatically maintained. Last updated: January 2026*
