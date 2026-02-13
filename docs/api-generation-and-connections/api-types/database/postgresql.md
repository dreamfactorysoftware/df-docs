---
sidebar_position: 3
title: PostgreSQL
id: postgresql
description: "Connect PostgreSQL to DreamFactory and generate secure REST APIs with RBAC, rate limiting, and SSO"
keywords: [PostgreSQL, Postgres, database API, REST API, RBAC, rate limiting, stored procedures, functions]
difficulty: "intermediate"
---

# Connecting PostgreSQL to DreamFactory

This guide walks you through connecting PostgreSQL to DreamFactory to auto-generate a secure REST API. You'll learn how to:

- Connect PostgreSQL and automatically generate REST API endpoints
- Lock down your API with RBAC, API keys, JWT, or SSO authentication
- Enable pagination, filtering, and expose stored functions
- Configure rate limiting and auditing for production environments

---

## Prerequisites

Before connecting PostgreSQL to DreamFactory, ensure you have:

- **PostgreSQL Instance**: A reachable PostgreSQL instance (version 9.6 or later recommended) with hostname, port, database name, and credentials
- **DreamFactory Installation**: An up-and-running DreamFactory instance with access to the Admin application
- **Required Drivers**: The `pdo_pgsql` PHP extension installed on the DreamFactory host (included in DreamFactory Cloud; for self-managed installations, see driver notes below)

:::tip[Networking Considerations]
Ensure PostgreSQL is network-accessible from your DreamFactory host. If using cloud-hosted PostgreSQL (AWS RDS, Google Cloud SQL, Azure Database for PostgreSQL), configure security groups or firewall rules to allow connections from your DreamFactory instance.
:::

---

## Generating a PostgreSQL-backed API

To generate a PostgreSQL-backed API, log in to your DreamFactory instance using an administrator account and navigate to **API Generation & Connections**. In the left sidebar, click on **API Types**, then select **Database**. Click the circular **+** button to create a new database service. Search for and select **PostgreSQL** from the list of available database types.

You are then presented with the **Service Details** form. Let's review the available fields:

* **Namespace**: The namespace forms part of your API URL, so ensure you use a lowercase string with no spaces or special characters. You also want to choose a name that allows you to easily identify the API's purpose. For instance for your PostgreSQL-backed API you might choose a name such as `postgres`, `pgdb`, or `analytics`. Keep in mind lowercasing the name is a requirement.
* **Label**: The label is used for referential purposes within the administration interface and system-related API responses. You can use something more descriptive here, such as "PostgreSQL Analytics Database API".
* **Description**: Like the label, the description is used for referential purposes within the administration interface and system-related API responses. We recommend including a brief description of what the API is used for.
* **Active**: This toggle determines if the API is active or not. By default it is set to active, however if you're not yet ready to begin using the API or would like to later temporarily disable it, just return to this screen and toggle the checkbox.

After completing these fields, click `Next` at the bottom of the interface to proceed to the connection configuration.

### Required Configuration Fields

There are six primary fields you need to complete in order to generate a PostgreSQL-backed API:

* **Host**: The database server's host address. This may be an IP address or a domain name.
* **Port Number**: The database server's port number. For PostgreSQL this is typically `5432`.
* **Database**: The name of the database you'd like to expose via the API.
* **Username**: The username associated with the database user account used to connect to the database.
* **Password**: The password associated with the database user account used to connect to the database.
* **Schema**: The PostgreSQL schema to use. Defaults to `public` if not specified.

### Additional Configuration Fields

PostgreSQL supports several additional connection parameters:

* **Charset**: Character set for the connection (e.g., `UTF8`).
* **SSL Mode**: SSL connection mode. Options include `disable`, `allow`, `prefer`, `require`, `verify-ca`, and `verify-full`.
* **Timezone**: Set the session timezone for date/time operations.
* **Application Name**: An identifier that appears in `pg_stat_activity` for connection tracking and debugging.

:::warning
Keep in mind you are generating an API which can in fact interact with the underlying database! While perhaps obvious, once you generate this API it means any data or schema manipulation requests you subsequently issue will affect your database. Therefore be sure to connect to a test database when first experimenting with DreamFactory so you don't issue requests that you later come to regret.
:::

### Optional Configuration Fields

Following the required fields there are a number of optional parameters. Don't worry about these too much at the moment, because chances are you're not going to need to modify any of the optional configuration fields at this time. However we'd like to identify a few fields which are used more often than others:

* **Maximum Records**: You can use this field to place an upper limit on the number of records returned.
* **Data Retrieval Caching Enabled**: Enabling caching dramatically improves performance. This field is used in conjunction with `Cache Time to Live`, introduced next.
* **Cache Time to Live (minutes)**: If data caching is enabled, you can use this field to specify the cache lifetime in minutes.
* **Allow Upsert**: Enable upsert (INSERT ... ON CONFLICT) operations via the API.

After completing the required fields in addition to any desired optional fields, you can proceed to the final step. Click `Next` or navigate directly to **Security Configuration** if needed, then click `Create & Test` to generate your API and test the connection.

After a moment a pop up message displays indicating `Service Saved Successfully`. Congratulations! You've just generated your PostgreSQL-backed API.

On save, DreamFactory has automatically:
- **Generated your REST API** with endpoints for all accessible tables and views
- **Created interactive API Documentation** based on the OpenAPI specification
- **Provisioned stored function endpoints** at `/_func/{function_name}` (if available)

You can now interact with your API using the API Docs interface. In the left sidebar, select **API Docs**, choose your PostgreSQL service from the dropdown, and click **Try it out** to test endpoints directly from the browser.

:::info[Driver Setup for Self-Managed Installations]
If you're running a self-managed DreamFactory instance and need to install the PostgreSQL PDO driver:

**Ubuntu/Debian:**
```bash
sudo apt-get install php-pgsql
sudo systemctl restart apache2  # or php-fpm
```

**CentOS/RHEL:**
```bash
sudo yum install php-pgsql
sudo systemctl restart httpd  # or php-fpm
```

For complete driver installation instructions, refer to the [Installing Additional Drivers](/getting-started/installing-dreamfactory/installing-additional-drivers) guide.
:::

### A Note About API Capabilities

PostgreSQL employs a sophisticated role and privilege system which gives administrators the ability to determine exactly what a user can do after successfully establishing a connection. Administrators can grant and revoke privileges on databases, schemas, tables, and even individual columns.

Because DreamFactory connects to your database on behalf of this user, the resulting API is logically constrained by that user's authorized capabilities. DreamFactory does however display a complete set of API documentation regardless, so if you are attempting to interact with the API via the API Docs or using any other client and aren't obtaining the desired outcome, check your database user permissions to confirm the user is authorized to carry out the desired task.

Also keep in mind this can serve as an excellent way to further lock down your API. Although DreamFactory offers excellent security-related features for restricting API access, it certainly doesn't hurt to additionally configure the connecting database user's privileges to reflect the desired API capabilities. For instance, if you intend for the API to be read-only, then create a database user with `SELECT` privileges only.

---

## Example API Requests

Once your PostgreSQL service is configured, you can interact with it using standard REST conventions.

### Retrieve All Records from a Table

```bash
curl -X GET "https://your-dreamfactory-instance.com/api/v2/postgres/_table/customers" \
  -H "X-DreamFactory-Api-Key: YOUR_API_KEY"
```

### Retrieve a Single Record by ID

```bash
curl -X GET "https://your-dreamfactory-instance.com/api/v2/postgres/_table/customers/42" \
  -H "X-DreamFactory-Api-Key: YOUR_API_KEY"
```

### Create a New Record

```bash
curl -X POST "https://your-dreamfactory-instance.com/api/v2/postgres/_table/customers" \
  -H "X-DreamFactory-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "resource": [
      {
        "name": "Acme Corp",
        "email": "contact@acme.com",
        "status": "active"
      }
    ]
  }'
```

### Update a Record

```bash
curl -X PUT "https://your-dreamfactory-instance.com/api/v2/postgres/_table/customers/42" \
  -H "X-DreamFactory-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "resource": [
      {
        "status": "inactive"
      }
    ]
  }'
```

### Delete a Record

```bash
curl -X DELETE "https://your-dreamfactory-instance.com/api/v2/postgres/_table/customers/42" \
  -H "X-DreamFactory-Api-Key: YOUR_API_KEY"
```

### Query with Filtering

```bash
curl -X GET "https://your-dreamfactory-instance.com/api/v2/postgres/_table/orders?filter=status%3Dpending" \
  -H "X-DreamFactory-Api-Key: YOUR_API_KEY"
```

### Execute a Stored Function

```bash
curl -X POST "https://your-dreamfactory-instance.com/api/v2/postgres/_func/calculate_total" \
  -H "X-DreamFactory-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "params": [
      {"name": "order_id", "value": 12345}
    ]
  }'
```

---

## Securing Your PostgreSQL API

**Everything is private by default.** DreamFactory requires an API Key bound to a Role to access any endpoint. For user-specific access, you can add JWT or SSO authentication.

### Minimum Viable Security Setup

Follow these steps to implement basic security for your PostgreSQL API:

#### Step 1: Create a Role

1. In the left sidebar under **API Generation & Connections**, click on **Role Based Access**
2. Click the circular **+** button to create a new Role
3. Give your role a descriptive name (e.g., `PostgreSQL Read-Only`)
4. In the **Access Overview** section, configure access permissions:
   - **Service**: Select your PostgreSQL service
   - **Component**: `_table/*` (all tables)
   - **Access**: `GET` only (read-only)
5. Click **Save** to create the role

Starting with read-only access is recommended as a security best practice (defense-in-depth).

#### Step 2: Create an API Key

1. In the left sidebar under **API Generation & Connections**, select **API Keys**
2. Click the circular **+** button to create a new key
3. Fill in the **Application Name** (e.g., `Analytics Dashboard`)
4. Under **Assign a Default Role**, select the role you created in Step 1
5. Click **Save** to generate your API Key

#### Step 3: Make API Calls

Include the API Key in your request headers:

```bash
curl -X GET "https://your-dreamfactory-instance.com/api/v2/postgres/_table/customers" \
  -H "X-DreamFactory-Api-Key: YOUR_API_KEY"
```

#### Step 4: Enable User Authentication (Optional)

For user-specific access, enable an SSO provider:

1. Navigate to **Security > Authentication**
2. Select an authentication service type (LDAP, OAuth, OIDC, SAML 2.0)
3. Configure your identity provider settings
4. Users authenticate and receive a **JWT** (session token)

User requests require both headers:

```bash
curl -X GET "https://your-dreamfactory-instance.com/api/v2/postgres/_table/orders" \
  -H "X-DreamFactory-Api-Key: YOUR_API_KEY" \
  -H "X-DreamFactory-Session-Token: USER_JWT_TOKEN"
```

For detailed authentication setup, see the [Security & Authentication](/Security/security-authentication) documentation.

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

### Connection Failures

**Symptom**: Connection test fails or service returns database errors

**Solutions**:
- Click **Test Connection** in the service configuration to verify connectivity
- Verify the `pdo_pgsql` extension is installed: run `php -m | grep pgsql`
- Check that PostgreSQL is accepting connections on the configured port
- Verify `pg_hba.conf` allows connections from the DreamFactory host
- Confirm the database user has `CONNECT` privilege on the database
- For SSL connections, ensure certificates are properly configured

### Schema Access Issues

**Symptom**: Tables don't appear or queries fail with permission errors

**Solutions**:
- Verify the correct schema is specified in the service configuration
- Confirm the database user has `USAGE` privilege on the schema
- Check that the user has `SELECT` (and other needed) privileges on tables
- Run `GRANT USAGE ON SCHEMA public TO your_user;` if using a non-superuser account

### Stored Function Issues

**Symptom**: Functions don't appear or fail when called

**Solutions**:
- Stored functions are callable at `/_func/{function_name}`
- Verify the function exists in the database schema
- Confirm the database user has `EXECUTE` privilege on the function
- Check parameter types and pass them correctly in the request body
- Review PostgreSQL logs for execution errors

### SSL Connection Issues

**Symptom**: Connection fails when SSL mode is required

**Solutions**:
- Verify the SSL mode setting matches your PostgreSQL server configuration
- For `verify-ca` or `verify-full` modes, ensure the CA certificate is available
- Check that the PostgreSQL server has SSL enabled (`ssl = on` in `postgresql.conf`)

---

## Next Steps

Now that your PostgreSQL API is connected and secured, explore these advanced features:

- **[Querying & Filtering](/api-generation-and-connections/api-types/database/querying-filtering)**: Learn advanced query syntax and filtering options
- **[Event Scripts](/api-generation-and-connections/event-scripts)**: Add custom business logic to API events
- **[Role-Based Access Control](/Security/role-based-access)**: Deep dive into advanced RBAC configurations

For additional help, consult the [Security FAQ](/Security/security-faq) or contact DreamFactory support.
