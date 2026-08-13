---
sidebar_position: 5
sidebar_label: "API Creation and Management"
title: "Creating and Managing APIs in DreamFactory | Service Types"
id: api-creation-management
description: How DreamFactory services work, the API types available, and the lifecycle of creating, securing, testing, and maintaining a generated API.
keywords: [DreamFactory service, create API, API types, database API, network API, scripted API, file API, service management, API lifecycle]
difficulty: "beginner"
---

# API Creation and Management

## Services Are the Unit of Work

Everything in DreamFactory is a **service**. A database connection is a service. A remote HTTP API you proxy is a service. So is a file store, an email sender, a script, and the platform's own administrative API.

A service has a **name**, which becomes its URL segment. Create a MySQL service named `sales` and its API lives at `/api/v2/sales`. That single idea explains most of the platform: you are not writing endpoints, you are registering sources and letting DreamFactory expose them consistently.

This page covers the shape of that work. The pages linked throughout go deeper on each specific type.

## The API Lifecycle

Creating a working, secured API is five steps. Skipping the middle three is the most common reason a new API returns `401` or `403`.

### 1. Create the service

In the admin interface, go to **API Generation & Connections → API Types** and pick the type you need. Give it a name, a label, and the connection details for the underlying source.

The name is the part that matters long term. It is the URL, it is what roles grant access to, and changing it later breaks every client that already calls it.

### 2. Configure it

Each type has its own configuration tab: host and credentials for a database, a base URL and headers for a remote API, a bucket and region for object storage. Two settings worth knowing on database services are **Data Retrieval Caching Enabled** and **Cache Time To Live**, covered in [Optimizing Database APIs](../getting-started/optimizing-dreamfactory/database.md).

### 3. Grant access with a role

A new service is not reachable by anyone until a role says so. Roles control which services a caller can touch, and at what level. See [Role-Based Access](../Security/role-based-access.md).

### 4. Issue an API key

Clients authenticate with an API key tied to an App, and often a session token tied to a user. See [API Keys](api-keys.md).

### 5. Test it in API Docs

Every service generates its own live OpenAPI documentation. Open **API Docs**, pick the service, and call it right there with your key attached. If it works in API Docs and fails in your client, the difference is almost always the key or the role, not the service.

## API Types

The types available in your installation depend on which connectors are installed and licensed. Grouped by what they do:

### Database

Generate a full REST API over an existing database, with no code. This is the most common starting point.

`mysql` · `mariadb` · `pgsql` · `sqlsrv` · `oracle` · `sqlite` · `mongodb` · `snowflake` · `bigquery` · `databricks` · `alloydb` · `aws_dynamodb` · `aws_redshift_db` · `azure_documentdb` · `azure_table` · `cassandra` · `couchdb` · `dremio` · `firebird` · `hana` · `ibmdb2` · `informix` · `memsql` · `salesforce_db` · `sqlanywhere` · `trino`

See [Generating a Database-backed API](api-types/database/generating-database-backed-api.md) and [Advanced Database API Features](advanced-database-api-features.md).

### Network and remote APIs

Wrap an existing HTTP or SOAP endpoint so it sits behind the same authentication, roles, rate limits and logging as everything else.

`rws` (remote web service) · `soap`

### Scripted

When a source does not fit any connector, write the endpoint yourself. Scripts run server-side in your choice of runtime.

`php` · `python` · `python3` · `nodejs`

See [Scripted Services and Endpoints](api-types/scripting/scripted-services-and-endpoints.md).

### File and storage

Expose a filesystem or object store as a REST API, including reading, writing, and folder operations.

`local_file` · `aws_s3` · `azure_blob` · `sftp_file` · `ftp_file` · `webdav_file` · `hadoop_hdfs` · `openstack_object_storage` · `rackspace_cloud_files`

See [File Services](api-types/file-services/file-services-overview.md).

### Email

`smtp_email` · `local_email` · `mailgun_email` · `aws_ses`

### Caching

Back DreamFactory's cache with a shared store rather than local files.

`cache_redis` · `cache_memcached` · `cache_local`

### Source control

Pull scripts and configuration from a repository instead of pasting them into the admin UI.

`github` · `gitlab` · `bitbucket`

### Authentication and directory

`ldap` · `adldap` · `saml` · `okta_saml` · `auth0_sso` · `oidc`, plus the `oauth_*` providers for Google, Microsoft, GitHub, Salesforce and others.

See [Authentication APIs](../Security/authentication-apis.md).

### Platform services

Some services are the platform itself rather than a source you configure. `system` is the administrative API, `user` handles user management, and `swagger` serves the API documentation. `api_builder` hosts custom composed APIs; see [API Builder](api-builder.md).

### Other

Depending on your installation you may also see `excel`, `logstash`, `mcp`, `ai_connection`, `ai_chat`, `agents`, IoT transports (`mqtt`, `amqp`), notification services (`apns`, `aws_sns`, `gcm`), and big-data connectors such as `apache_hive`.

## Managing Services Over the REST API

Anything the admin interface does, the System API does too, which is what makes DreamFactory scriptable. Services live at `/api/v2/system/service`, and the available types at `/api/v2/system/service_type`.

```
GET /api/v2/system/service?fields=id,name,label,type,is_active
GET /api/v2/system/service_type?fields=name,label,group
```

Use this to audit what exists, script environment promotion, or find every service of a given type. See [Service Management](../system-settings/the-system-api/03-service-management.md) for the full surface.

## Deactivating Rather Than Deleting

Every service has an `is_active` flag. Turning a service off stops it answering requests while keeping its configuration, its roles, and its history intact. Deleting is permanent and takes the configuration with it. When you are retiring an API, deactivate it first and leave it that way long enough to be sure nothing still calls it.

## Related Reading

- [API Types](api-types/database/database-overview.md)
- [API Builder](api-builder.md)
- [Event Scripts](event-scripts.md)
- [Interacting With the API](interacting-with-api.md)
- [Role-Based Access](../Security/role-based-access.md)
