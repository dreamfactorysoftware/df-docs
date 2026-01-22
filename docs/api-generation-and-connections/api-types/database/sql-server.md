---
sidebar_position: 5
title: Microsoft SQL Server
id: sql-server
description: "Connect Microsoft SQL Server to DreamFactory and generate secure REST APIs with RBAC, rate limiting, and SSO"
keywords: [SQL Server, MSSQL, database API, REST API, RBAC, rate limiting, stored procedures, Azure]
difficulty: "intermediate"
---

# Connecting Microsoft SQL Server to DreamFactory

This guide walks you through connecting Microsoft SQL Server to DreamFactory to auto-generate a secure REST API. You'll learn how to:

- Connect SQL Server and automatically generate REST API endpoints
- Lock down your API with RBAC, API keys, JWT, or SSO authentication
- Enable pagination, filtering, and expose stored procedures
- Configure rate limiting and auditing for production environments

---

## Quick Reference: DreamFactory vs Microsoft Tools

Understanding how DreamFactory fits into the Microsoft ecosystem:

| Need | Use in DreamFactory | Similar Microsoft Term |
| ----- | ----- | ----- |
| CRUD REST API over tables/views | Database service → auto-generated endpoints + OpenAPI | Data API Builder (DAB) |
| ETL copy/transform/schedule | Out of scope; DreamFactory serves as API layer; integrate with your ETL tools | Azure Data Factory "Copy/Data Flow" |
| Evented automation & low-code apps | Call DreamFactory APIs from your app/flow | Power Platform SQL connector |

:::info[Reference Links]
For readers familiar with Microsoft tools:
- [Data API Builder Overview](https://learn.microsoft.com/en-us/azure/data-api-builder/overview)
- [Azure Data Factory SQL Server Connector](https://learn.microsoft.com/en-us/azure/data-factory/connector-sql-server)
- [Power Platform SQL Connector](https://learn.microsoft.com/en-us/connectors/sql/)
:::

---

## Prerequisites

Before connecting SQL Server to DreamFactory, ensure you have:

- **SQL Server Instance**: A reachable SQL Server instance with hostname, port, database name, and credentials
- **DreamFactory Installation**: An up-and-running DreamFactory instance with access to the Admin application
- **Required Drivers**: Appropriate drivers installed on the DreamFactory host (if self-managed):
  - **Windows**: Microsoft ODBC Driver 17/18 and PHP SQLSRV/PDO_SQLSRV extensions
  - **Linux**: Distribution-specific ODBC drivers and PHP extensions

:::tip[Networking Considerations]
If you're evaluating private connectivity models, consider equivalent Microsoft patterns like Managed VNet or Private Link when planning your network architecture. Ensure SQL Server is network-accessible from your DreamFactory host.
:::

---

## Generating a SQL Server-backed API

To generate a SQL Server-backed API, log in to your DreamFactory instance using an administrator account and navigate to **API Generation & Connections**. In the left sidebar, click on **API Types**, then select **Database**. Click the circular **+** button to create a new database service. Search for and select **Microsoft SQL Server** from the list of available database types.

You are then presented with the **Service Details** form. Let's review the available fields:

* **Namespace**: The namespace forms part of your API URL, so ensure you use a lowercase string with no spaces or special characters. You also want to choose a name that allows you to easily identify the API's purpose. For instance for your SQL Server-backed API you might choose a name such as `mssql`, `corporate`, or `crm`. Keep in mind lowercasing the name is a requirement.
* **Label**: The label is used for referential purposes within the administration interface and system-related API responses. You can use something more descriptive here, such as "SQL Server-backed Corporate Database API".
* **Description**: Like the label, the description is used for referential purposes within the administration interface and system-related API responses. We recommend including a brief description of what the API is used for.
* **Active**: This toggle determines if the API is active or not. By default it is set to active, however if you're not yet ready to begin using the API or would like to later temporarily disable it, just return to this screen and toggle the checkbox.

After completing these fields, click `Next` at the bottom of the interface to proceed to the connection configuration.

### Required Configuration Fields

There are only five (sometimes six) fields you need to complete in order to generate a database-backed API. These include:

* **Host**: The database server's host address. This may be an IP address or a domain name.
* **Port Number**: The database server's port number. For SQL Server this is typically `1433`.
* **Database**: The name of the database you'd like to expose via the API.
* **Username**: The username associated with the database user account used to connect to the database.
* **Password**: The password associated with the database user account used to connect to the database.
* **Schema**: If your database supports the concept of a schema, you may specify it here. SQL Server supports schemas (e.g., `dbo`).

Additionally, you can configure the connection using a **DSN** (Data Source Name) if you have one set up, and select the appropriate **Driver** (`SQLSRV` or `PDO_SQLSRV`).

:::warning
Keep in mind you are generating an API which can in fact interact with the underlying database! While perhaps obvious, once you generate this API it means any data or schema manipulation requests you subsequently issue will affect your database. Therefore be sure to connect to a test database when first experimenting with DreamFactory so you don't issue requests that you later come to regret.
:::

### Optional Configuration Fields

Following the required fields there are a number of optional parameters. Don't worry about these too much at the moment, because chances are you're not going to need to modify any of the optional configuration fields at this time. However we'd like to identify a few fields which are used more often than others:

* **Maximum Records**: You can use this field to place an upper limit on the number of records returned.
* **Data Retrieval Caching Enabled**: Enabling caching dramatically improves performance. This field is used in conjunction with `Cache Time to Live`, introduced next.
* **Cache Time to Live (minutes)**: If data caching is enabled, you can use this field to specify the cache lifetime in minutes.

After completing the required fields in addition to any desired optional fields, you can proceed to the final step. Click `Next` or navigate directly to **Security Configuration** if needed, then click `Create & Test` to generate your API and test the connection.

After a moment a pop up message displays indicating `Service Saved Successfully`. Congratulations! You've just generated your SQL Server-backed API. 

On save, DreamFactory has automatically:
- **Generated your REST API** with endpoints for all accessible tables and views
- **Created interactive API Documentation** based on the OpenAPI specification
- **Provisioned stored procedure endpoints** at `/_proc/{procedure_name}` (if available)

You can now interact with your API using the API Docs interface. In the left sidebar, select **API Docs**, choose your SQL Server service from the dropdown, and click **Try it out** to test endpoints directly from the browser.

:::info[Driver Setup for Self-Managed Installations]
If you're running a self-managed DreamFactory instance on Windows and need to install SQLSRV/PDO_SQLSRV extensions:

```powershell
# Download Microsoft ODBC Driver 17 or 18
# Download PHP SQL Server extensions from PECL
# Copy .dll files to PHP extensions directory
# Enable in php.ini:
extension=php_sqlsrv_81_ts.dll
extension=php_pdo_sqlsrv_81_ts.dll
```

For complete driver installation instructions, refer to the [Installing Additional Drivers](/getting-started/installing-dreamfactory/installing-additional-drivers) guide.
:::

### A Note About API Capabilities

SQL Server employs a user authorization system which gives administrators the ability to determine exactly what a user can do after successfully establishing a connection. Administrators can grant and revoke user privileges, and in doing so determine what databases a user can connect to, whether the user can create, retrieve, update, and delete records, and whether the user has the ability to manage the schema.

Because DreamFactory connects to your database on behalf of this user, the resulting API is logically constrained by that user's authorized capabilities. DreamFactory does however display a complete set of API documentation regardless, so if you are attempting to interact with the API via the API Docs or using any other client and aren't obtaining the desired outcome, check your database user permissions to confirm the user is authorized to carry out the desired task.

Also keep in mind this can serve as an excellent way to further lock down your API. Although DreamFactory offers excellent security-related features for restricting API access, it certainly doesn't hurt to additionally configure the connecting database user's privileges to reflect the desired API capabilities. For instance, if you intend for the API to be read-only, then create a database user with read-only authorization. If API read and create capabilities are desired, then configure the user accordingly.

---

## Securing Your SQL Server API

**Everything is private by default.** DreamFactory requires an API Key bound to a Role to access any endpoint. For user-specific access, you can add JWT or SSO authentication (Entra ID, LDAP, OAuth, OIDC, SAML).

### Minimum Viable Security Setup

Follow these steps to implement basic security for your SQL Server API:

#### Step 1: Create a Role

1. In the left sidebar under **API Generation & Connections**, click on **Role Based Access**
2. Click the circular **+** button to create a new Role
3. Give your role a descriptive name (e.g., `SQL Server Read-Only`)
4. In the **Access Overview** section, configure access permissions:
   - **Service**: Select your SQL Server service
   - **Component**: `_table/*` (all tables)
   - **Access**: `GET` only (read-only)
5. Click **Save** to create the role

Starting with read-only access is recommended as a security best practice (defense-in-depth).

#### Step 2: Create an API Key

1. In the left sidebar under **API Generation & Connections**, select **API Keys**
2. Click the circular **+** button to create a new key
3. Fill in the **Application Name** (e.g., `Mobile App` or `Web Portal`)
4. Under **Assign a Default Role**, select the role you created in Step 1
5. Click **Save** to generate your API Key

#### Step 3: Make API Calls

Include the API Key in your request headers:

```bash
curl -X GET "https://your-dreamfactory-instance.com/api/v2/mssql/_table/customers" \
  -H "X-DreamFactory-Api-Key: YOUR_API_KEY"
```

#### Step 4: Enable User Authentication (Optional)

For user-specific access, enable an SSO provider:

1. Navigate to **Security → Authentication**
2. Select an authentication service type (Active Directory, LDAP, OAuth, OIDC, SAML 2.0)
3. Configure your identity provider settings
4. Users authenticate and receive a **JWT** (session token)

User requests require both headers:

```bash
curl -X GET "https://your-dreamfactory-instance.com/api/v2/mssql/_table/orders" \
  -H "X-DreamFactory-Api-Key: YOUR_API_KEY" \
  -H "X-DreamFactory-Session-Token: USER_JWT_TOKEN"
```

For detailed authentication setup, see the [Security & Authentication](/Security/security-authentication) documentation.

---

## Role-Based Access Control (RBAC) Patterns

DreamFactory provides granular access control at multiple levels. Here are recommended RBAC patterns for SQL Server APIs:

### Defense-in-Depth with Read-Only Views

Start by exposing read-only database views rather than direct table access:

1. Create views in SQL Server that contain only the data needed by the application
2. Grant role access only to views: `/mssql/_table/view_*`
3. Allow only `GET` requests on view resources

This approach minimizes exposure of sensitive data and prevents accidental modifications.

### Table, Column, and Verb Scoping

Configure fine-grained access at the role level:

- **Table-level**: Restrict access to specific tables (e.g., `/mssql/_table/customers`)
- **Column-level**: Use field filtering to hide sensitive columns
- **Verb-level**: Allow only specific HTTP methods (`GET`, `POST`, `PUT`, `DELETE`)

### Record-Level Filtering

Apply record-level filters to limit data visibility based on user attributes:

1. In the Role configuration, add a **Filter** condition
2. Use lookup keys or session variables to scope data (e.g., `user_id = {session.user_id}`)
3. Filters are automatically applied to all matching requests

### Service Roles for Machine-to-Machine

For service-to-service communication, create dedicated roles with:

- Very narrow verb and path permissions
- No user authentication required
- Separate API keys for each consuming service
- Consider IP whitelisting for additional security

---

## Rate Limiting, Throttling, and Auditing

### Configuring Rate Limits

DreamFactory allows you to set rate limits per user, role, service, or endpoint. To configure rate limits through the admin interface:

1. In the left sidebar under **Security**, select **Rate Limiting**
2. Click the circular **+** button to create a new limit
3. Configure:
   - **Type**: User, Role, Service, or Endpoint
   - **Rate**: Number of requests per time period
   - **Period**: Time window (minute, hour, day)
   - **Limit by**: API key, user, or IP address
4. Click **Save** to apply the limit

Alternatively, configure limits via the System API:

```bash
curl -X POST "https://your-dreamfactory-instance.com/api/v2/system/limit" \
  -H "X-DreamFactory-Api-Key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "instance",
    "rate": 1000,
    "period": "minute",
    "service_id": 1
  }'
```

### Handling Rate Limit Responses

When rate limits are exceeded, DreamFactory returns a `429 Too Many Requests` status code. Implement client-side retry logic with exponential backoff:

```javascript
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  // Wait and retry request
}
```

### Audit Logging

DreamFactory logs all API requests for auditing and operational purposes:

- In the left navbar, select **Admin Settings → Logs** to view request history
- Filter logs by service, user, status code, or date range
- Configure log retention and rotation in system settings
- Export logs to external logging systems (Logstash, Splunk, etc.)

For production environments, consider enabling detailed logging and monitoring. See the [Logstash Integration](/system-settings/logstash) documentation.

---

## Troubleshooting

Common issues and their solutions:

### Authentication Errors (401/403)

**Symptom**: Requests return `401 Unauthorized` or `403 Forbidden`

**Solutions**:
- Verify `X-DreamFactory-Api-Key` header is included in requests
- Confirm the API key is associated with a role that has access to the service
- For user-specific requests, ensure both API key and JWT session token are provided
- Check that the role has appropriate permissions for the requested resource and HTTP method

### Connectivity and Driver Issues

**Symptom**: Connection test fails or service returns database errors

**Solutions**:
- Click **Test Connection** in the service configuration to verify connectivity
- On Windows, confirm SQLSRV extensions are installed: run `php -m | grep sqlsrv`
- Verify Microsoft ODBC Driver 17 or 18 is installed
- Check firewall rules allow connections from DreamFactory host to SQL Server
- Confirm SQL Server is configured to accept TCP/IP connections
- Verify credentials have appropriate database permissions

### Filter and Query Issues

**Symptom**: Queries with filters return unexpected results or errors

**Solutions**:
- URL-encode special characters in filter parameters (parentheses, operators)
- Verify supported operators: `=`, `!=`, `>`, `<`, `>=`, `<=`, `LIKE`, `IN`, `BETWEEN`
- Use proper filter syntax: `?filter=column_name=value`
- For complex filters, use the `filter` parameter with SQL-style conditions
- Check the [Querying & Filtering](/api-generation-and-connections/api-types/database/querying-filtering) documentation for syntax examples

### Stored Procedure Issues

**Symptom**: Stored procedures don't appear or fail when called

**Solutions**:
- Stored procedures are callable at `/_proc/{procedure_name}`
- Verify the procedure exists in the database
- Confirm the database user has `EXECUTE` permissions on the procedure
- Check parameter types and pass them correctly in the request body
- Review SQL Server logs for execution errors

---

## DreamFactory vs. Microsoft Data API Builder (DAB)

Both DreamFactory and Microsoft Data API Builder can quickly expose REST APIs from SQL Server. Here's how they compare:

**DreamFactory provides:**
- **Admin UI**: Web-based interface for managing all configurations
- **RBAC tied to API keys/roles**: Fine-grained access control without code
- **Rate limiting**: Built-in throttling and quota management
- **Interactive API docs**: Auto-generated OpenAPI documentation with "Try it out" functionality
- **Multi-source unification**: Manage APIs for multiple databases, file storage, external services in one console
- **Enterprise features**: SSO integration, audit logging, event scripting, and more

**When to use each:**
- **DreamFactory**: When you need a comprehensive API management platform with security, governance, and multi-source support
- **DAB**: When you need a lightweight, configuration-file-based tool focused solely on data API generation

For more information on DAB, see the [Microsoft Learn documentation](https://learn.microsoft.com/en-us/azure/data-api-builder/overview).

---

## Next Steps

Now that your SQL Server API is connected and secured, explore these advanced features:

- **[Querying & Filtering](/api-generation-and-connections/api-types/database/querying-filtering)**: Learn advanced query syntax and filtering options
- **[Event Scripts](/api-generation-and-connections/event-scripts)**: Add custom business logic to API events
- **[Role-Based Access Control](/Security/role-based-access)**: Deep dive into advanced RBAC configurations

For additional help, consult the [Security FAQ](/Security/security-faq) or contact DreamFactory support.

