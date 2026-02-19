---
sidebar_position: 1
title: DreamFactory Docs
id: introduction
slug: /
description: DreamFactory is a self-hosted platform providing governed API access to any data source for enterprise apps and local LLMs.
keywords: [DreamFactory, governed API access, self-hosted API platform, enterprise data access, API security, RBAC, database API, LLM data access, dreamfactory open source, dreamfactory community edition, what is dreamfactory, dreamfactory version, dreamfactory latest]
difficulty: beginner
---

# DreamFactory Documentation

DreamFactory is a secure, self-hosted enterprise data access platform that provides governed API access to any data source. Connect enterprise applications and on-prem LLMs to databases, file storage, and external services — with role-based access control, identity passthrough, and full API lifecycle management.

## What is DreamFactory?

DreamFactory is a self-hosted API generation platform that instantly creates secure, governed REST and GraphQL APIs for any data source — without writing backend code. Point DreamFactory at a MySQL, PostgreSQL, Oracle, MongoDB, or any of 20+ supported databases and it introspects the schema, generates a fully documented API, and enforces access control — all through a point-and-click admin interface. The same applies to file storage (S3, SFTP, Azure Blob), email providers, caching services (Redis, Memcached), and legacy SOAP services.

DreamFactory is available in two editions. **DreamFactory Community Edition** is open source under the Apache 2.0 license — the full source code is available on [GitHub](https://github.com/dreamfactorysoftware/dreamfactory) and can be self-hosted at no cost. **DreamFactory Enterprise** adds SSO and identity passthrough (SAML, LDAP, Active Directory, OAuth), advanced RBAC with field-level permissions, commercial database connectors (Oracle, IBM Db2, SAP HANA), dedicated support SLAs, and Logstash/ELK audit logging. Both editions are fully self-hosted — no data leaves your infrastructure.

The current stable release is **DreamFactory 4.x**. See the [GitHub releases page](https://github.com/dreamfactorysoftware/dreamfactory/releases) for the latest version, changelog, and upgrade notes. If you are upgrading from an earlier version, see the [Upgrading & Migrating DreamFactory](/upgrades-and-migrations/upgrading-and-migrating-dreamfactory) guide.

## Quick Navigation

**Developers — build and customize APIs**
- [API Generation: Databases](/api-generation-and-connections/api-types/database/generating-a-database-backed-api) — Connect MySQL, PostgreSQL, MongoDB, SQL Server, Oracle and more
- [Event Scripts](/api-generation-and-connections/event-scripts) — Attach PHP, Python, or Node.js logic to any API event
- [Scripted Services & Endpoints](/api-generation-and-connections/api-types/scripting/scripted-services-and-endpoints) — Build entirely custom API services from script
- [Querying & Filtering](/api-generation-and-connections/api-types/database/querying-and-filtering) — Advanced filtering, sorting, pagination, and field selection

**DevOps — install and operate DreamFactory**
- [Docker Installation](/getting-started/installing-dreamfactory/docker-installation) — Quickest path to a running instance
- [Kubernetes / Helm Installation](/getting-started/installing-dreamfactory/helm-installation) — Production-grade cluster deployment
- [Linux Installation](/getting-started/installing-dreamfactory/linux-installation) — Traditional Linux server setup
- [Windows Installation](/getting-started/installing-dreamfactory/windows-installation) — Windows Server with IIS

**Security teams — govern API access**
- [Role-Based Access Control](/Security/role-based-access) — Per-endpoint, per-method, per-field permissions
- [SSO & Authentication](/Security/authenticating-your-apis) — SAML, LDAP, OAuth, OpenID Connect, identity passthrough
- [API Keys](/api-generation-and-connections/api-keys) — Generate and scope API keys per role

**Data teams — connect and query data**
- [Database API Overview](/api-generation-and-connections/api-types/database/database-overview) — Supported databases and connector configuration
- [Querying & Filtering](/api-generation-and-connections/api-types/database/querying-and-filtering) — DreamFactory's query parameter syntax
- [Converting Excel to JSON](/api-generation-and-connections/api-types/file/converting-excel-to-json) — Transform Excel workbooks into queryable REST APIs

## Deployment Options

DreamFactory runs wherever your data lives — no cloud dependency, no vendor lock-in.

| Platform | Description | Guide |
|---|---|---|
| **Docker** | Single-command startup using the official Docker image; ideal for dev environments and quick evaluations | [Docker Installation](/getting-started/installing-dreamfactory/docker-installation) |
| **Kubernetes / Helm** | Production-grade deployment with the official Helm chart; supports horizontal scaling and secrets management | [Helm Installation](/getting-started/installing-dreamfactory/helm-installation) |
| **Linux** | Native installation on Ubuntu, Debian, CentOS, RHEL, or Amazon Linux using the automated installer script | [Linux Installation](/getting-started/installing-dreamfactory/linux-installation) |
| **Windows Server** | IIS-based deployment on Windows Server 2019/2022 with PHP FastCGI | [Windows Installation](/getting-started/installing-dreamfactory/windows-installation) |
| **Raspberry Pi** | Lightweight ARM deployment for edge computing and IoT data gateway use cases | [Linux Installation](/getting-started/installing-dreamfactory/linux-installation) |

---

## Getting Started

New to DreamFactory? Start here to get up and running quickly.

### Install DreamFactory

Choose the deployment that matches your environment:

- **[Linux Installation](/getting-started/installing-dreamfactory/linux-installation)** — Native install on Ubuntu, Debian, CentOS, RHEL using the automated installer
- **[Windows Installation](/getting-started/installing-dreamfactory/windows-installation)** — Windows Server with IIS and PHP FastCGI
- **[Docker Installation](/getting-started/installing-dreamfactory/docker-installation)** — Single-command startup; ideal for dev environments and quick evaluations
- **[Deploy DreamFactory on Kubernetes with Helm](/getting-started/installing-dreamfactory/helm-installation)** — Production-grade cluster deployment with horizontal scaling
- **[Raspberry Pi Installation](/getting-started/installing-dreamfactory/raspberrypi-install)** — ARM64 deployment for edge computing and IoT API gateway use cases
- **[Basic Configuration](/getting-started/dreamfactory-configuration/basic-configuration)** — Essential setup after installation

### Connect Your Data

Generate REST APIs for your databases and file storage in minutes:

- **[Generate a Database API](/api-generation-and-connections/api-types/database/generating-a-database-backed-api)** — Connect MySQL, PostgreSQL, MongoDB, SQL Server, Oracle, and 20+ other databases
- **[Query & Filter Data](/api-generation-and-connections/api-types/database/querying-and-filtering)** — Filter, sort, paginate, and use dynamic user placeholders for row-level security
- **[Excel to JSON API](/api-generation-and-connections/api-types/file/converting-excel-to-json)** — Expose Excel workbooks and CSV files as queryable REST endpoints

### Secure & Govern

Lock down your APIs with enterprise-grade access control:

- **[Role-Based Access Control](/Security/role-based-access)** — Per-endpoint, per-method, per-field permissions for every user and app
- **[API Keys](/api-generation-and-connections/api-keys)** — Generate scoped API keys and bind them to specific roles
- **[Authenticating Your APIs](/Security/authenticating-your-apis)** — SAML, LDAP, OAuth, OpenID Connect, and identity passthrough

### Automate & Extend

Add custom business logic without rebuilding your stack:

- **[Event Scripts](/api-generation-and-connections/event-scripts)** — Attach PHP, Python, or Node.js scripts to any API event (pre/post request hooks)
- **[Scripted Services & Endpoints](/api-generation-and-connections/api-types/scripting/scripted-services-and-endpoints)** — Build fully custom API services from script

---

## API Generation & Connections

Learn how to create and manage APIs for your data sources.

### Database APIs
- **[Generating Database-Backed APIs](/api-generation-and-connections/api-types/database/generating-a-database-backed-api)** - Connect MySQL, PostgreSQL, MongoDB, SQL Server, Oracle, and more
- **[Querying & Filtering](/api-generation-and-connections/api-types/database/querying-and-filtering)** - Advanced database queries, filtering, sorting, and pagination
- **[SQL Server](/api-generation-and-connections/api-types/database/sql-server)** - SQL Server specific configuration

### File Storage APIs
- **[Creating AWS S3 REST API](/api-generation-and-connections/api-types/file/creating-an-aws-s3-rest-api)** - S3 file storage integration
- **[Creating SFTP REST API](/api-generation-and-connections/api-types/file/creating-an-sftp-rest-api)** - SFTP server integration
- **[Converting Excel to JSON](/api-generation-and-connections/api-types/file/converting-excel-to-json)** - Transform Excel files to JSON

### Scripting
- **[Scripted Services & Endpoints](/api-generation-and-connections/api-types/scripting/scripted-services-and-endpoints)** - Add custom business logic with JavaScript, PHP, or Python
- **[Event Scripts](/api-generation-and-connections/event-scripts)** - Trigger scripts before/after API calls
- **[Scripting Resources](/api-generation-and-connections/api-types/scripting/scripting-resources)** - Available scripting libraries and examples

### General
- **[API Keys](/api-generation-and-connections/api-keys)** - Generate and manage API keys
- **[Interacting with APIs](/api-generation-and-connections/interacting-with-the-api)** - Making API calls and using the API Docs tab
- **[Advanced Database Features](/api-generation-and-connections/advanced-database-api-features)** - Stored procedures, relationships, and virtual fields

---

## Security & Access Control

Implement enterprise-grade security for your APIs.

- **[Role-Based Access Control](/Security/role-based-access)** - Define granular permissions for users and endpoints
- **[Authentication APIs](/Security/authenticating-your-apis)** - API-based authentication workflows
- **[Okta Setup](/Security/creating-your-auth-service/okta-setup)** - Integrate with Okta OAuth
- **[SQL Server Security](/Security/sqlsrv-config)** - SQL Server authentication configuration
- **[Security FAQ](/Security/security-faq)** - Common security questions answered

---

## System API

Programmatically manage DreamFactory for automation and DevOps workflows.

- **[System API Overview](/system-settings/the-system-api/using-the-system-apis)** - Introduction to the System API
- **[User Management](/system-settings/the-system-api/02-user-management)** - Manage users programmatically
- **[Service Management](/system-settings/the-system-api/03-service-management)** - Manage services via API
- **[Role Management](/system-settings/the-system-api/04-role-management)** - Manage roles via API
- **[API Key Management](/system-settings/the-system-api/05-api-key-management)** - Manage API keys via API

---

## Configuration

- **[CORS & SSL](/system-settings/config/cors-and-ssl)** - Configure CORS and SSL settings
- **[Date & Time](/getting-started/dreamfactory-configuration/date-and-time-configuration)** - Time zone and date format settings

---

## Optimization & Performance

- **[Database Optimization](/getting-started/optimizing-dreamfactory/database-apis)** - Database caching and connection pooling

---

## Upgrades & Migrations

Keep your DreamFactory instance up to date.

- **[Upgrading & Migrating DreamFactory](/upgrades-and-migrations/upgrading-and-migrating-dreamfactory)** - Move between environments
- **[Upgrading to PHP 8.1](/upgrades-and-migrations/upgrading-to-php-8.1)** - PHP 8.1 migration guide
- **[Upgrading PHP on Windows](/upgrades-and-migrations/upgrading-php-on-windows)** - Windows-specific PHP upgrades

---

## Additional Resources

- **[DreamFactory Blog](https://blog.dreamfactory.com)** - Tutorials, use cases, and product updates
- **[GitHub Repository](https://github.com/dreamfactorysoftware/dreamfactory)** - Contribute to the open-source project
- **[Legacy Guide](https://guide.dreamfactory.com/docs)** - Previous version documentation