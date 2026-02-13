---
sidebar_position: 6
title: Google AlloyDB
id: alloydb
description: "Connect Google AlloyDB to DreamFactory and generate secure REST APIs with RBAC, rate limiting, and SSO"
keywords: [AlloyDB, Google Cloud, PostgreSQL, database API, REST API, RBAC, GCP]
difficulty: "intermediate"
---

# Connecting Google AlloyDB to DreamFactory

This guide walks you through connecting Google AlloyDB to DreamFactory to auto-generate a secure REST API. AlloyDB is Google Cloud's fully managed PostgreSQL-compatible database service, offering high performance and availability. You'll learn how to:

- Connect AlloyDB and automatically generate REST API endpoints
- Lock down your API with RBAC, API keys, JWT, or SSO authentication
- Enable pagination, filtering, and expose stored functions
- Configure rate limiting and auditing for production environments

---

## Quick Reference: AlloyDB vs PostgreSQL

AlloyDB is fully PostgreSQL-compatible, so most PostgreSQL concepts apply directly. Key differences:

| Aspect | AlloyDB | Standard PostgreSQL |
| ------ | ------- | ------------------- |
| Deployment | Managed GCP service | Self-managed or cloud-hosted |
| Connectivity | Private IP (VPC) or Public IP with Auth Proxy | Direct TCP/IP |
| Authentication | IAM integration available | Standard username/password |
| Driver | `pdo_pgsql` (same as PostgreSQL) | `pdo_pgsql` |

:::info[Google Cloud Documentation]
For AlloyDB-specific setup and networking:
- [AlloyDB Overview](https://cloud.google.com/alloydb/docs/overview)
- [Connecting to AlloyDB](https://cloud.google.com/alloydb/docs/connect-overview)
- [AlloyDB Auth Proxy](https://cloud.google.com/alloydb/docs/auth-proxy/overview)
:::

---

## Prerequisites

Before connecting AlloyDB to DreamFactory, ensure you have:

- **AlloyDB Instance**: A running AlloyDB cluster and primary instance in Google Cloud with database name and credentials
- **Network Access**: Either:
  - DreamFactory deployed in the same VPC as AlloyDB (Private IP)
  - AlloyDB Auth Proxy running on the DreamFactory host (recommended for public access)
  - Public IP enabled on AlloyDB with appropriate firewall rules
- **DreamFactory Installation**: An up-and-running DreamFactory instance with access to the Admin application
- **Required Drivers**: The `pdo_pgsql` PHP extension installed on the DreamFactory host (included in DreamFactory Cloud)

:::tip[Networking Considerations]
AlloyDB instances are typically accessed via Private IP within a VPC. If your DreamFactory instance is outside the VPC, you'll need to use the AlloyDB Auth Proxy or configure VPC peering. The Auth Proxy handles SSL/TLS encryption and IAM-based authentication automatically.
:::

---

## Generating an AlloyDB-backed API

To generate an AlloyDB-backed API, log in to your DreamFactory instance using an administrator account and navigate to **API Generation & Connections**. In the left sidebar, click on **API Types**, then select **Database**. Click the circular **+** button to create a new database service. Search for and select **AlloyDB** (or **PostgreSQL** if AlloyDB is not listed separately) from the list of available database types.

You are then presented with the **Service Details** form. Let's review the available fields:

* **Namespace**: The namespace forms part of your API URL, so ensure you use a lowercase string with no spaces or special characters. You also want to choose a name that allows you to easily identify the API's purpose. For instance for your AlloyDB-backed API you might choose a name such as `alloydb`, `gcp-data`, or `analytics`. Keep in mind lowercasing the name is a requirement.
* **Label**: The label is used for referential purposes within the administration interface and system-related API responses. You can use something more descriptive here, such as "AlloyDB Production Database".
* **Description**: Like the label, the description is used for referential purposes within the administration interface and system-related API responses. We recommend including a brief description of what the API is used for.
* **Active**: This toggle determines if the API is active or not. By default it is set to active, however if you're not yet ready to begin using the API or would like to later temporarily disable it, just return to this screen and toggle the checkbox.

After completing these fields, click `Next` at the bottom of the interface to proceed to the connection configuration.

### Required Configuration Fields

There are six primary fields you need to complete in order to generate an AlloyDB-backed API:

* **Host**: The AlloyDB instance IP address or hostname. For Private IP connections, use the internal IP. For Auth Proxy connections, use `127.0.0.1` (localhost).
* **Port Number**: The database server's port number. For AlloyDB this is typically `5432`. For Auth Proxy, use the port you've configured (default `5432`).
* **Database**: The name of the database you'd like to expose via the API.
* **Username**: The database username. This can be a PostgreSQL user or, if using IAM authentication with Auth Proxy, the IAM principal.
* **Password**: The password for the database user.
* **Schema**: The PostgreSQL schema to use. Defaults to `public` if not specified.

:::warning
Keep in mind you are generating an API which can in fact interact with the underlying database! While perhaps obvious, once you generate this API it means any data or schema manipulation requests you subsequently issue will affect your database. Therefore be sure to connect to a test database when first experimenting with DreamFactory so you don't issue requests that you later come to regret.
:::

### Optional Configuration Fields

Following the required fields there are a number of optional parameters:

* **Maximum Records**: You can use this field to place an upper limit on the number of records returned.
* **Data Retrieval Caching Enabled**: Enabling caching dramatically improves performance. This field is used in conjunction with `Cache Time to Live`, introduced next.
* **Cache Time to Live (minutes)**: If data caching is enabled, you can use this field to specify the cache lifetime in minutes.
* **Allow Upsert**: Enable upsert (INSERT ... ON CONFLICT) operations via the API.

After completing the required fields in addition to any desired optional fields, you can proceed to the final step. Click `Next` or navigate directly to **Security Configuration** if needed, then click `Create & Test` to generate your API and test the connection.

After a moment a pop up message displays indicating `Service Saved Successfully`. Congratulations! You've just generated your AlloyDB-backed API.

On save, DreamFactory has automatically:
- **Generated your REST API** with endpoints for all accessible tables and views
- **Created interactive API Documentation** based on the OpenAPI specification
- **Provisioned stored function endpoints** at `/_func/{function_name}` (if available)

You can now interact with your API using the API Docs interface. In the left sidebar, select **API Docs**, choose your AlloyDB service from the dropdown, and click **Try it out** to test endpoints directly from the browser.

---

## Setting Up AlloyDB Auth Proxy

If your DreamFactory instance needs to connect to AlloyDB from outside the VPC, the AlloyDB Auth Proxy is the recommended approach:

### Step 1: Install the Auth Proxy

```bash
# Download the Auth Proxy
curl -o alloydb-auth-proxy https://storage.googleapis.com/alloydb-auth-proxy/v1.4.0/alloydb-auth-proxy.linux.amd64
chmod +x alloydb-auth-proxy
sudo mv alloydb-auth-proxy /usr/local/bin/
```

### Step 2: Authenticate with Google Cloud

```bash
# Using a service account (recommended for production)
gcloud auth activate-service-account --key-file=/path/to/service-account-key.json

# Or using user credentials (for development)
gcloud auth application-default login
```

### Step 3: Start the Proxy

```bash
# Replace with your AlloyDB instance connection name
alloydb-auth-proxy \
  "projects/YOUR_PROJECT/locations/YOUR_REGION/clusters/YOUR_CLUSTER/instances/YOUR_INSTANCE" \
  --port=5432 &
```

### Step 4: Configure DreamFactory

In DreamFactory, configure the AlloyDB service with:
- **Host**: `127.0.0.1`
- **Port**: `5432` (or your chosen proxy port)
- **Database**, **Username**, **Password**: Your AlloyDB credentials

:::info[Running as a Service]
For production deployments, run the Auth Proxy as a systemd service to ensure it starts automatically and restarts on failure. See the [Auth Proxy documentation](https://cloud.google.com/alloydb/docs/auth-proxy/connect) for systemd unit file examples.
:::

---

## Example API Requests

Once your AlloyDB service is configured, you can interact with it using standard REST conventions.

### Retrieve All Records from a Table

```bash
curl -X GET "https://your-dreamfactory-instance.com/api/v2/alloydb/_table/customers" \
  -H "X-DreamFactory-Api-Key: YOUR_API_KEY"
```

### Retrieve a Single Record by ID

```bash
curl -X GET "https://your-dreamfactory-instance.com/api/v2/alloydb/_table/customers/42" \
  -H "X-DreamFactory-Api-Key: YOUR_API_KEY"
```

### Create a New Record

```bash
curl -X POST "https://your-dreamfactory-instance.com/api/v2/alloydb/_table/customers" \
  -H "X-DreamFactory-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "resource": [
      {
        "name": "Cloud Corp",
        "email": "contact@cloudcorp.com",
        "region": "us-central1"
      }
    ]
  }'
```

### Update a Record

```bash
curl -X PUT "https://your-dreamfactory-instance.com/api/v2/alloydb/_table/customers/42" \
  -H "X-DreamFactory-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "resource": [
      {
        "status": "premium"
      }
    ]
  }'
```

### Delete a Record

```bash
curl -X DELETE "https://your-dreamfactory-instance.com/api/v2/alloydb/_table/customers/42" \
  -H "X-DreamFactory-Api-Key: YOUR_API_KEY"
```

### Execute a Stored Function

```bash
curl -X POST "https://your-dreamfactory-instance.com/api/v2/alloydb/_func/calculate_usage" \
  -H "X-DreamFactory-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "params": [
      {"name": "customer_id", "value": 42},
      {"name": "period", "value": "monthly"}
    ]
  }'
```

---

## Securing Your AlloyDB API

**Everything is private by default.** DreamFactory requires an API Key bound to a Role to access any endpoint. For user-specific access, you can add JWT or SSO authentication.

### Minimum Viable Security Setup

Follow these steps to implement basic security for your AlloyDB API:

#### Step 1: Create a Role

1. In the left sidebar under **API Generation & Connections**, click on **Role Based Access**
2. Click the circular **+** button to create a new Role
3. Give your role a descriptive name (e.g., `AlloyDB Read-Only`)
4. In the **Access Overview** section, configure access permissions:
   - **Service**: Select your AlloyDB service
   - **Component**: `_table/*` (all tables)
   - **Access**: `GET` only (read-only)
5. Click **Save** to create the role

#### Step 2: Create an API Key

1. In the left sidebar under **API Generation & Connections**, select **API Keys**
2. Click the circular **+** button to create a new key
3. Fill in the **Application Name** (e.g., `GCP Analytics Service`)
4. Under **Assign a Default Role**, select the role you created in Step 1
5. Click **Save** to generate your API Key

#### Step 3: Make API Calls

Include the API Key in your request headers:

```bash
curl -X GET "https://your-dreamfactory-instance.com/api/v2/alloydb/_table/customers" \
  -H "X-DreamFactory-Api-Key: YOUR_API_KEY"
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
- Check that the role has appropriate permissions for the requested resource and HTTP method

### Connection Failures

**Symptom**: Connection test fails or service returns database errors

**Solutions**:
- Click **Test Connection** in the service configuration to verify connectivity
- For Auth Proxy connections, verify the proxy is running: `ps aux | grep alloydb-auth-proxy`
- Check that the Auth Proxy has valid credentials and the service account has the `roles/alloydb.client` IAM role
- For Private IP connections, verify VPC peering or Shared VPC is configured correctly
- Confirm the AlloyDB instance is running in the Google Cloud Console

### Auth Proxy Issues

**Symptom**: Auth Proxy fails to connect or terminates unexpectedly

**Solutions**:
- Verify the connection name format: `projects/PROJECT/locations/REGION/clusters/CLUSTER/instances/INSTANCE`
- Ensure the service account has the `Cloud AlloyDB Client` role
- Check Auth Proxy logs for specific error messages
- Verify the AlloyDB instance accepts connections (not paused or stopped)

### IAM Authentication Issues

**Symptom**: IAM database authentication fails

**Solutions**:
- Ensure the IAM principal has been granted database access using `GRANT` statements
- Verify the `alloydb.instances.connect` IAM permission is assigned
- Check that IAM database authentication is enabled on the AlloyDB instance

### Schema Access Issues

**Symptom**: Tables don't appear or queries fail with permission errors

**Solutions**:
- Verify the correct schema is specified in the service configuration
- Confirm the database user has `USAGE` privilege on the schema
- Check that the user has `SELECT` (and other needed) privileges on tables

---

## Next Steps

Now that your AlloyDB API is connected and secured, explore these advanced features:

- **[Querying & Filtering](/api-generation-and-connections/api-types/database/querying-filtering)**: Learn advanced query syntax and filtering options
- **[Event Scripts](/api-generation-and-connections/event-scripts)**: Add custom business logic to API events
- **[Role-Based Access Control](/Security/role-based-access)**: Deep dive into advanced RBAC configurations

For additional help, consult the [Security FAQ](/Security/security-faq) or contact DreamFactory support.
