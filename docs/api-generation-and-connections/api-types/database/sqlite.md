---
sidebar_position: 4
title: SQLite
id: sqlite
description: "Connect SQLite databases to DreamFactory and generate secure REST APIs for local or embedded database files"
keywords: [SQLite, database API, REST API, embedded database, local database, file-based database]
difficulty: "beginner"
---

# Connecting SQLite to DreamFactory

This guide walks you through connecting SQLite to DreamFactory to auto-generate a secure REST API. SQLite is ideal for development, testing, prototyping, and applications that require an embedded database. You'll learn how to:

- Connect SQLite database files and automatically generate REST API endpoints
- Lock down your API with RBAC, API keys, JWT, or SSO authentication
- Enable pagination and filtering for your data
- Configure rate limiting and auditing for production environments

---

## Prerequisites

Before connecting SQLite to DreamFactory, ensure you have:

- **SQLite Database File**: An existing SQLite database file (`.db`, `.sqlite`, or `.sqlite3` extension) accessible from the DreamFactory host
- **DreamFactory Installation**: An up-and-running DreamFactory instance with access to the Admin application
- **Required Drivers**: The `pdo_sqlite` PHP extension installed on the DreamFactory host (included by default in most PHP installations)

:::tip[File Permissions]
Ensure the DreamFactory process has read (and write, if modifications are needed) permissions on the SQLite database file. For web server deployments, this typically means the web server user (e.g., `www-data`, `apache`, `nginx`) needs appropriate access.
:::

---

## Generating a SQLite-backed API

To generate a SQLite-backed API, log in to your DreamFactory instance using an administrator account and navigate to **API Generation & Connections**. In the left sidebar, click on **API Types**, then select **Database**. Click the circular **+** button to create a new database service. Search for and select **SQLite** from the list of available database types.

You are then presented with the **Service Details** form. Let's review the available fields:

* **Namespace**: The namespace forms part of your API URL, so ensure you use a lowercase string with no spaces or special characters. You also want to choose a name that allows you to easily identify the API's purpose. For instance for your SQLite-backed API you might choose a name such as `localdb`, `appdata`, or `testdb`. Keep in mind lowercasing the name is a requirement.
* **Label**: The label is used for referential purposes within the administration interface and system-related API responses. You can use something more descriptive here, such as "SQLite Application Database".
* **Description**: Like the label, the description is used for referential purposes within the administration interface and system-related API responses. We recommend including a brief description of what the API is used for.
* **Active**: This toggle determines if the API is active or not. By default it is set to active, however if you're not yet ready to begin using the API or would like to later temporarily disable it, just return to this screen and toggle the checkbox.

After completing these fields, click `Next` at the bottom of the interface to proceed to the connection configuration.

### Required Configuration Fields

SQLite requires only one configuration field:

* **Database**: The absolute path to the SQLite database file on the DreamFactory host. For example: `/var/www/data/myapp.db` or `/home/dreamfactory/databases/app.sqlite`

:::warning
Keep in mind you are generating an API which can in fact interact with the underlying database! While perhaps obvious, once you generate this API it means any data or schema manipulation requests you subsequently issue will affect your database. Therefore be sure to connect to a test database when first experimenting with DreamFactory so you don't issue requests that you later come to regret.
:::

### Optional Configuration Fields

Following the required field there are a number of optional parameters:

* **Maximum Records**: You can use this field to place an upper limit on the number of records returned.
* **Data Retrieval Caching Enabled**: Enabling caching improves performance. This field is used in conjunction with `Cache Time to Live`, introduced next.
* **Cache Time to Live (minutes)**: If data caching is enabled, you can use this field to specify the cache lifetime in minutes.
* **Allow Upsert**: Enable upsert operations via the API.

After completing the required field in addition to any desired optional fields, you can proceed to the final step. Click `Next` or navigate directly to **Security Configuration** if needed, then click `Create & Test` to generate your API and test the connection.

After a moment a pop up message displays indicating `Service Saved Successfully`. Congratulations! You've just generated your SQLite-backed API.

On save, DreamFactory has automatically:
- **Generated your REST API** with endpoints for all accessible tables and views
- **Created interactive API Documentation** based on the OpenAPI specification

You can now interact with your API using the API Docs interface. In the left sidebar, select **API Docs**, choose your SQLite service from the dropdown, and click **Try it out** to test endpoints directly from the browser.

:::info[Creating a New SQLite Database]
If you need to create a new SQLite database, you can do so from the command line:

```bash
# Create an empty database
sqlite3 /path/to/your/database.db "SELECT 1;"

# Create with initial schema
sqlite3 /path/to/your/database.db < schema.sql
```

Or use DreamFactory's schema API to create tables after connecting an empty database file.
:::

### A Note About API Capabilities

Unlike client-server databases, SQLite doesn't have a built-in user permission system. Access control is managed at the filesystem level. This means:

1. If DreamFactory can read the file, it can query all tables
2. If DreamFactory can write to the file, it can modify all data and schema

Because of this, DreamFactory's RBAC system becomes especially important for SQLite APIs. Use DreamFactory roles to restrict access to specific tables, columns, and HTTP methods.

---

## Example API Requests

Once your SQLite service is configured, you can interact with it using standard REST conventions.

### Retrieve All Records from a Table

```bash
curl -X GET "https://your-dreamfactory-instance.com/api/v2/localdb/_table/users" \
  -H "X-DreamFactory-Api-Key: YOUR_API_KEY"
```

### Retrieve a Single Record by ID

```bash
curl -X GET "https://your-dreamfactory-instance.com/api/v2/localdb/_table/users/1" \
  -H "X-DreamFactory-Api-Key: YOUR_API_KEY"
```

### Create a New Record

```bash
curl -X POST "https://your-dreamfactory-instance.com/api/v2/localdb/_table/users" \
  -H "X-DreamFactory-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "resource": [
      {
        "name": "John Doe",
        "email": "john@example.com",
        "created_at": "2026-02-12"
      }
    ]
  }'
```

### Update a Record

```bash
curl -X PUT "https://your-dreamfactory-instance.com/api/v2/localdb/_table/users/1" \
  -H "X-DreamFactory-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "resource": [
      {
        "email": "john.doe@example.com"
      }
    ]
  }'
```

### Delete a Record

```bash
curl -X DELETE "https://your-dreamfactory-instance.com/api/v2/localdb/_table/users/1" \
  -H "X-DreamFactory-Api-Key: YOUR_API_KEY"
```

### Query with Filtering

```bash
curl -X GET "https://your-dreamfactory-instance.com/api/v2/localdb/_table/orders?filter=status%3Dcomplete" \
  -H "X-DreamFactory-Api-Key: YOUR_API_KEY"
```

### Query with Pagination

```bash
curl -X GET "https://your-dreamfactory-instance.com/api/v2/localdb/_table/products?limit=10&offset=20" \
  -H "X-DreamFactory-Api-Key: YOUR_API_KEY"
```

---

## Securing Your SQLite API

**Everything is private by default.** DreamFactory requires an API Key bound to a Role to access any endpoint. For user-specific access, you can add JWT or SSO authentication.

### Minimum Viable Security Setup

Follow these steps to implement basic security for your SQLite API:

#### Step 1: Create a Role

1. In the left sidebar under **API Generation & Connections**, click on **Role Based Access**
2. Click the circular **+** button to create a new Role
3. Give your role a descriptive name (e.g., `SQLite Read-Only`)
4. In the **Access Overview** section, configure access permissions:
   - **Service**: Select your SQLite service
   - **Component**: `_table/*` (all tables)
   - **Access**: `GET` only (read-only)
5. Click **Save** to create the role

Starting with read-only access is recommended as a security best practice (defense-in-depth).

#### Step 2: Create an API Key

1. In the left sidebar under **API Generation & Connections**, select **API Keys**
2. Click the circular **+** button to create a new key
3. Fill in the **Application Name** (e.g., `Mobile App`)
4. Under **Assign a Default Role**, select the role you created in Step 1
5. Click **Save** to generate your API Key

#### Step 3: Make API Calls

Include the API Key in your request headers:

```bash
curl -X GET "https://your-dreamfactory-instance.com/api/v2/localdb/_table/users" \
  -H "X-DreamFactory-Api-Key: YOUR_API_KEY"
```

For detailed authentication setup including JWT and SSO, see the [Security & Authentication](/Security/security-authentication) documentation.

---

## Use Cases for SQLite

SQLite is well-suited for several scenarios:

### Development and Testing

Create a local SQLite database that mirrors your production schema for rapid development and testing without needing to connect to external database servers.

### Embedded Applications

Mobile apps, desktop applications, and IoT devices can bundle SQLite databases. Use DreamFactory to expose a REST API for data sync or backup.

### Prototyping

Quickly prototype an API without provisioning database infrastructure. Create tables via the schema API and start building your frontend immediately.

### Static or Infrequently Changed Data

Reference data, configuration tables, or lookup values that rarely change are ideal candidates for SQLite-backed APIs.

---

## Troubleshooting

Common issues and their solutions:

### Authentication Errors (401/403)

**Symptom**: Requests return `401 Unauthorized` or `403 Forbidden`

**Solutions**:
- Verify `X-DreamFactory-Api-Key` header is included in requests
- Confirm the API key is associated with a role that has access to the service
- Check that the role has appropriate permissions for the requested resource and HTTP method

### File Not Found Errors

**Symptom**: Connection test fails with "unable to open database file"

**Solutions**:
- Verify the database path is an absolute path (not relative)
- Confirm the file exists at the specified location
- Check file permissions allow the web server user to read the file
- For write operations, ensure the parent directory is also writable (SQLite creates temporary files)

### Permission Denied Errors

**Symptom**: Read operations work but write operations fail

**Solutions**:
- SQLite needs write access to both the database file and its parent directory
- Check ownership: `ls -la /path/to/database.db`
- Fix permissions: `chmod 664 /path/to/database.db && chmod 775 /path/to/parent/directory`
- Ensure the web server user owns or has group access to the file

### Database Locked Errors

**Symptom**: Operations fail with "database is locked" errors

**Solutions**:
- SQLite supports limited concurrent writes; consider if another process is accessing the database
- Ensure WAL (Write-Ahead Logging) mode is enabled for better concurrency: `PRAGMA journal_mode=WAL;`
- For high-concurrency scenarios, consider migrating to a client-server database like PostgreSQL

### Driver Not Found

**Symptom**: Service creation fails with PDO driver error

**Solutions**:
- Verify `pdo_sqlite` is installed: `php -m | grep sqlite`
- Install if missing:
  - Ubuntu/Debian: `sudo apt-get install php-sqlite3`
  - CentOS/RHEL: `sudo yum install php-pdo`
- Restart web server after installation

---

## Next Steps

Now that your SQLite API is connected and secured, explore these advanced features:

- **[Querying & Filtering](/api-generation-and-connections/api-types/database/querying-filtering)**: Learn advanced query syntax and filtering options
- **[Event Scripts](/api-generation-and-connections/event-scripts)**: Add custom business logic to API events
- **[Role-Based Access Control](/Security/role-based-access)**: Deep dive into advanced RBAC configurations

For additional help, consult the [Security FAQ](/Security/security-faq) or contact DreamFactory support.
