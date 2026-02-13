---
sidebar_position: 1
title: Database Overview
id: database-overview
description: "Supported databases in DreamFactory - complete list of SQL and NoSQL database connectors with licensing information"
keywords: [database, SQL, NoSQL, connectors, supported databases, API generation]
difficulty: "beginner"
---

# Database Connectors Overview

DreamFactory auto-generates secure REST APIs from your existing databases. Connect any supported database and instantly get full CRUD endpoints, schema management, stored procedure access, and interactive API documentation.

---

## Supported Databases

DreamFactory supports a wide range of SQL and NoSQL databases. Some connectors are included in the open-source package, while others require a commercial license.

### Open Source (Included)

These database connectors are included in DreamFactory OSS and all commercial editions:

| Database | Driver | Default Port | Documentation |
| -------- | ------ | ------------ | ------------- |
| **PostgreSQL** | `pdo_pgsql` | 5432 | [PostgreSQL Guide](./postgresql) |
| **MySQL / MariaDB** | `pdo_mysql` | 3306 | [MySQL Guide](./generating-database-backed-api) |
| **SQLite** | `pdo_sqlite` | N/A (file) | [SQLite Guide](./sqlite) |
| **Microsoft SQL Server** | `pdo_sqlsrv` | 1433 | [SQL Server Guide](./sql-server) |
| **Google AlloyDB** | `pdo_pgsql` | 5432 | [AlloyDB Guide](./alloydb) |

### Commercial License Required

These database connectors require a DreamFactory commercial license (Gold or Platinum editions):

| Database | Driver | Default Port | Notes |
| -------- | ------ | ------------ | ----- |
| **Oracle Database** | `pdo_oci` | 1521 | Oracle Instant Client required |
| **IBM DB2** | `pdo_ibm` | 50000 | IBM Data Server Driver required |
| **IBM Informix** | `pdo_informix` | 9088 | Informix Client SDK required |
| **SAP SQL Anywhere** | `pdo_sqlanywhere` | 2638 | SQL Anywhere client required |
| **Firebird** | `pdo_firebird` | 3050 | Firebird client library required |

:::info[Licensing]
For commercial database connector licensing, contact [DreamFactory Sales](https://www.dreamfactory.com/contact) or visit the [pricing page](https://www.dreamfactory.com/pricing).
:::

---

## Common Features Across All Databases

Regardless of which database you connect, DreamFactory provides:

### Auto-Generated REST Endpoints

- **Tables**: `GET/POST/PUT/PATCH/DELETE` on `/_table/{table_name}`
- **Schema**: `GET/POST/PUT/DELETE` on `/_schema` for schema management
- **Stored Procedures**: `GET/POST` on `/_proc/{procedure_name}`
- **Stored Functions**: `GET/POST` on `/_func/{function_name}`

### Query Capabilities

- **Filtering**: Use SQL-style filters via query parameters
- **Sorting**: Order results by any column(s)
- **Pagination**: Limit and offset for large result sets
- **Field Selection**: Return only specified columns
- **Related Data**: Include related records via joins

### Security Features

- **API Key Authentication**: Required for all endpoint access
- **Role-Based Access Control**: Table, column, and verb-level permissions
- **Record-Level Filtering**: Restrict data visibility per user/role
- **Rate Limiting**: Configurable throttling per user, role, or endpoint
- **Audit Logging**: Track all API requests

---

## Choosing the Right Database Connector

### By Use Case

| Use Case | Recommended Database |
| -------- | -------------------- |
| New projects, cloud-native apps | PostgreSQL, AlloyDB |
| Microsoft ecosystem integration | SQL Server |
| Embedded/local applications | SQLite |
| Legacy enterprise systems | Oracle, DB2, Informix |
| High-performance analytics | PostgreSQL, AlloyDB |

### By Cloud Provider

| Cloud Provider | Native Database Service | DreamFactory Connector |
| -------------- | ----------------------- | ---------------------- |
| AWS | RDS PostgreSQL, RDS MySQL, RDS SQL Server | PostgreSQL, MySQL, SQL Server |
| Google Cloud | Cloud SQL, AlloyDB | PostgreSQL, MySQL, AlloyDB |
| Microsoft Azure | Azure SQL, Azure PostgreSQL | SQL Server, PostgreSQL |
| Self-hosted | Any supported database | Full compatibility |

---

## Connection Architecture

DreamFactory connects to your databases using standard database drivers:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   API Client    │────▶│   DreamFactory   │────▶│    Database     │
│  (App/Service)  │◀────│   (REST API)     │◀────│    Server       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                        │
    HTTP/HTTPS              PDO Driver              Native Protocol
    + API Key               (pdo_pgsql,            (PostgreSQL,
    + JWT (optional)         pdo_mysql, etc.)       MySQL, etc.)
```

### Key Architectural Points

1. **DreamFactory acts as a secure proxy** - Your database is never directly exposed
2. **Connection credentials are stored encrypted** - Never transmitted to API clients
3. **Single connection pool** - Efficient database resource utilization
4. **Caching layer** - Optional response caching for improved performance

---

## Driver Installation

DreamFactory Cloud includes all drivers pre-installed. For self-managed installations:

### PHP PDO Extensions Required

| Database | PHP Extension | Installation (Ubuntu/Debian) |
| -------- | ------------- | ---------------------------- |
| PostgreSQL | `pdo_pgsql` | `apt-get install php-pgsql` |
| MySQL | `pdo_mysql` | `apt-get install php-mysql` |
| SQLite | `pdo_sqlite` | `apt-get install php-sqlite3` |
| SQL Server | `pdo_sqlsrv` | See [SQL Server driver docs](./sql-server#driver-setup-for-self-managed-installations) |
| Oracle | `pdo_oci` | Requires Oracle Instant Client |

For complete installation instructions, see [Installing Additional Drivers](/getting-started/installing-dreamfactory/installing-additional-drivers).

---

## Performance Optimization

### Connection Pooling

DreamFactory maintains persistent database connections. Configure pool size based on expected concurrent API requests.

### Caching

Enable caching for read-heavy workloads:
- **Per-service caching**: Configure in service settings
- **Cache TTL**: Set appropriate expiration times
- **Cache backends**: Redis, Memcached, or local file cache

### Query Optimization

- Use **field selection** to return only needed columns
- Apply **filters** server-side rather than client-side
- Use **pagination** for large datasets
- Consider **database views** for complex, frequently-used queries

---

## Security Best Practices

### Database User Permissions

Create dedicated database users for DreamFactory with minimal required permissions:

```sql
-- PostgreSQL example: read-only user
CREATE USER dreamfactory_ro WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE myapp TO dreamfactory_ro;
GRANT USAGE ON SCHEMA public TO dreamfactory_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO dreamfactory_ro;
```

### Network Security

- Use private networks/VPCs when possible
- Enable SSL/TLS for database connections
- Restrict database access to DreamFactory IP addresses
- Never expose databases directly to the internet

### DreamFactory RBAC

Layer DreamFactory's RBAC on top of database permissions:
- Create roles with minimum required access
- Use record-level filters for multi-tenant applications
- Separate API keys for different applications/environments

---

## Next Steps

- **[Generating a Database-Backed API](./generating-database-backed-api)**: Step-by-step guide for your first database API
- **[Querying & Filtering](./querying-filtering)**: Learn advanced query syntax
- **[PostgreSQL](./postgresql)**: Connect PostgreSQL databases
- **[SQLite](./sqlite)**: Connect local SQLite databases
- **[SQL Server](./sql-server)**: Connect Microsoft SQL Server
- **[AlloyDB](./alloydb)**: Connect Google AlloyDB

For database-specific questions, consult the individual database guides or contact DreamFactory support.
