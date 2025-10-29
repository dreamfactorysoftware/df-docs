---
sidebar_position: 1
title: Introduction
id: introduction
slug: /
---

# Welcome to DreamFactory Documentation

DreamFactory is an open-source REST API platform that automatically generates secure, fully documented APIs for any data source in minutes. Whether you're connecting to databases, external services, or file systems, DreamFactory eliminates the need to write backend code.

---

## Getting Started

New to DreamFactory? Start here to get up and running quickly.

- **[Introducing REST & DreamFactory](/introduction/introducing-rest-and-dreamfactory)** - Understanding REST APIs and how DreamFactory works
- **[Docker Installation](/getting-started/installing-dreamfactory/docker-installation)** - Quick start with Docker containers
- **[Helm/Kubernetes Installation](/getting-started/installing-dreamfactory/helm-installation)** - Deploy to Kubernetes clusters
- **[Linux Installation](/getting-started/installing-dreamfactory/linux-installation)** - Traditional Linux server installation
- **[Windows Installation](/getting-started/installing-dreamfactory/windows-installation)** - Install on Windows servers
- **[Basic Configuration](/getting-started/dreamfactory-configuration/basic-configuration)** - Essential setup after installation

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