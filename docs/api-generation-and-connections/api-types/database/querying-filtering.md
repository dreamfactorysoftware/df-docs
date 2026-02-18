---
sidebar_position: 2
title: Querying and Filtering Records
id: querying-and-filtering
description: Learn how to query, filter, sort, and paginate database records using DreamFactory's REST API
keywords: [database query, API filtering, REST API query, pagination, sorting, SQL filter, LIKE operator, IN operator, filter placeholder, row level security, user id placeholder, text placeholder api]
difficulty: "intermediate"
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Querying and Filtering Records in DreamFactory

## Quick Reference

| Parameter | Purpose | Example |
|-----------|---------|---------|
| `filter` | Filter records | `filter=(status='active')` |
| `fields` | Select columns | `fields=id,name,email` |
| `limit` | Max records | `limit=10` |
| `offset` | Skip records | `offset=20` |
| `order` | Sort results | `order=name ASC` |
| `include_count` | Get total count | `include_count=true` |
| `ids` | Get by IDs | `ids=1,2,3` |

## Overview

This guide assumes you have already [generated a database-backed API](/api-generation-and-connections/api-types/database/generating-a-database-backed-api). If not, start there first to connect your database and generate your REST API endpoints before applying filters and queries.

DreamFactory provides powerful filtering capabilities for database operations, allowing you to precisely query and manipulate your data through the REST API. This guide will walk you through the basics and advanced features of filtering in DreamFactory.

## Basic Usage

### Endpoint Structure
```http
GET https://{your-dreamfactory-url}/api/v2/{api_name}/_table/{table_name}?filter={filter_string}
```

| Component | Description | Example |
|-----------|-------------|---------|
| `api_name` | Name of your API service | `mysql`, `postgres` |
| `table_name` | Database table to query | `customers`, `orders` |
| `filter_string` | URL-encoded filter expression | `(status='active')` |

:::note
Your HTTP client will automatically handle URL encoding of special characters in the filter string.
:::

### Quick Examples
```http
# Basic filtering
GET /api/v2/db/_table/users?filter=(status='active')

# Multiple conditions
GET /api/v2/db/_table/orders?filter=(status='pending') AND (total>100)

# Pagination and sorting
GET /api/v2/db/_table/products?limit=10&offset=0&order=name ASC
```

## Filter Syntax

:::note
DreamFactory uses SQL-like syntax for filtering. Ensure you are familiar with SQL operators and their usage in DreamFactory.
:::

### Logical Operators
| Operator | Description | Example |
|----------|-------------|---------|
| `AND` | Both conditions must be true | `(status='active') AND (age>21)` |
| `OR` | Either condition must be true | `(status='active') OR (status='pending')` |
| `NOT` | Negates the condition | `NOT(status='deleted')` |

### Comparison Operators
| Operator | Description | Example |
|----------|-------------|---------|
| `=`, `!=` | Equality/Inequality | `(status = 'active')` |
| `>`, `>=` | Greater than (or equal) | `(age > 21)` |
| `<`, `<=` | Less than (or equal) | `(price < 100)` |
| `IN` | Match any value in set | `(status IN ('active','pending'))` |
| `LIKE` | Pattern matching | `(email LIKE '%@company.com')` |
| `IS NULL` | Check for null values | `(phone IS NULL)` |
| Range check | Value in range | `(age>=18) AND (age<=65)` |

### String Operations

:::note Database Compatibility
The `CONTAINS`, `STARTS WITH`, and `ENDS WITH` operators have limited database support. For maximum compatibility across all databases (MySQL, PostgreSQL, SQL Server, etc.), use the `LIKE` operator with wildcards instead.
:::

| Operator | Description | Example | Recommended Alternative |
|----------|-------------|---------|-------------------------|
| `CONTAINS` | Contains string | `(description CONTAINS 'important')` | `(description LIKE '%important%')` |
| `STARTS WITH` | Begins with string | `(name STARTS WITH 'App')` | `(name LIKE 'App%')` |
| `ENDS WITH` | Ends with string | `(file ENDS WITH '.pdf')` | `(file LIKE '%.pdf')` |

### Common Filter Examples
```http
# Name filters
GET /api/v2/db/_table/contacts?filter=(first_name='John') AND (last_name='Smith')
GET /api/v2/db/_table/contacts?filter=(first_name='John') OR (first_name='Jane')
GET /api/v2/db/_table/contacts?filter=first_name!='John'

# Pattern matching
GET /api/v2/db/_table/contacts?filter=first_name like 'J%'
GET /api/v2/db/_table/contacts?filter=email like '%@mycompany.com'

# Numeric comparisons
GET /api/v2/db/_table/users?filter=(age >= 30) AND (age < 40)

# Social media handles
GET /api/v2/db/_table/contacts?filter=(twitter like '%jon%') OR (skype like '%jon%')
```

## Advanced Features

### Field Selection and Metadata
*Allows you to specify which fields to return in the response, reducing the amount of data transferred and improving performance. You can also include metadata such as record count and schema information.*
```http
# Select specific fields
GET /api/v2/db/_table/users?fields=id,name,email

# Include record count
GET /api/v2/db/_table/users?include_count=true

# Include schema information
GET /api/v2/db/_table/users?include_schema=true
```

### Pagination and Sorting
*Allows you to control the number of records returned and the order in which they are displayed.*
```http
# Paginate results
GET /api/v2/db/_table/users?limit=10&offset=20

# Sort results
GET /api/v2/db/_table/users?order=name ASC

# Group results
GET /api/v2/db/_table/users?group=category
```

### Related Record Filtering
*Allows you to filter records based on values in related tables.*
```http
# Filter by related table
GET /api/v2/db/_table/orders?filter=(customer.country='USA')

# Filter with nested conditions
GET /api/v2/db/_table/products?filter=(category.name CONTAINS 'Electronics')
```

### Aggregate Functions
*Allows you to perform calculations on data, such as counting records or calculating averages, directly within the query.*
```http
# Count records by status
GET /api/v2/db/_table/orders?group=status&fields=status,COUNT(*)

# Calculate averages
GET /api/v2/db/_table/products?fields=category,AVG(price)
```

### Parameter Replacement
*Allows you to use placeholders for values, which are replaced with actual values at runtime.*

```http
GET /api/v2/db/_table/users?filter=status=:status_param

# Request Body
{
    "params": {
        ":status_param": "active"
    }
}
```

:::tip Security Best Practice
Always use parameter replacement to prevent SQL injection attacks. This ensures that user input is safely handled.
:::

### Batch Operations
*Allows you to handle multiple records in a single call, with options to continue processing after failures or roll back all changes if any operation fails.*
| Parameter | Description | Example |
|-----------|-------------|---------|
| `continue` | Continue processing after failures | `continue=true` |
| `rollback` | Rollback all changes if any operation fails | `rollback=true` |

### Record Identification
```http
# Get by single ID
GET /api/v2/db/_table/users/123

# Get by multiple IDs
GET /api/v2/db/_table/users?ids=1,2,3

# Get by custom ID field
GET /api/v2/db/_table/users?id_field=email&ids=user@example.com
```

## Using URL Filter Parameters and Placeholders

DreamFactory supports dynamic placeholder tokens in filter strings that are resolved server-side at query time. This is the foundation of DreamFactory's row-level security model — you can restrict which rows a user sees without writing any custom code.

### Filter Parameter Syntax

The `filter` URL parameter accepts SQL-like expressions. Special characters must be URL-encoded when passed in a query string:

```http
# Unencoded (some HTTP clients encode automatically)
GET /api/v2/mydb/_table/orders?filter=status='active'

# Manually URL-encoded (use this in raw curl or manual URL construction)
GET /api/v2/mydb/_table/orders?filter=status%3D%27active%27
```

The `=` operator encodes to `%3D`; single quotes encode to `%27`. Most REST clients (Postman, Insomnia, curl with `--data-urlencode`) handle this automatically.

### Built-In User Placeholder Tokens

DreamFactory automatically resolves the following placeholder tokens to the currently authenticated user's attributes **before executing the SQL query**. The replacement happens in DreamFactory's request pipeline — the database never sees the placeholder string.

| Token | Resolves to | Type |
|---|---|---|
| `{user.id}` | The authenticated user's integer ID | Integer |
| `{user.email}` | The authenticated user's email address | String |
| `{user.name}` | The user's display name (`first_name last_name`) | String |
| `{user.is_admin}` | `1` if the user is a DreamFactory admin, `0` otherwise | Integer |

### Row-Level Security with `{user.id}`

The most common use case is restricting database rows to only the records that belong to the authenticated user. For example, if your `orders` table has a `user_id` column that stores the DreamFactory user ID:

```http
GET /api/v2/mydb/_table/orders?filter=user_id%3D{user.id}
```

DreamFactory replaces `{user.id}` with the actual user ID of the caller before running the query. User A (ID 42) gets only their orders; user B (ID 99) gets only their orders — using the same API endpoint, no custom code required.

A full curl example:

```bash
curl -X GET \
  "https://your-df-instance/api/v2/mydb/_table/orders?filter=user_id%3D{user.id}" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "X-DreamFactory-Session-Token: USER_SESSION_TOKEN"
```

### Enforcing Placeholders via Role-Based Access (Recommended)

Passing `{user.id}` as a URL parameter in every client request is convenient, but a determined caller could omit the filter and retrieve all records if the role permits broad `GET` access. The secure approach is to **enforce the filter at the Role level**, so it applies automatically regardless of what the client sends.

To configure a mandatory filter in a Role:

1. In the DreamFactory Admin panel, navigate to **Roles** in the left sidebar.
2. Open or create the role you want to restrict.
3. Under **Service Access**, find the database service and table you want to restrict.
4. Click the table row to expand its settings, then click **Advanced Filters**.
5. Add a filter condition: field `user_id`, operator `=`, value `{user.id}`.
6. Save the role.

With this configuration, every API request made by a user assigned to this role automatically has `user_id = {user.id}` appended to any filter — the client cannot override or omit it.

This pattern — combining RBAC with `{user.id}` placeholder filters — is DreamFactory's recommended approach to multi-tenant row-level security. See [Role-Based Access Control](/Security/role-based-access) for a full explanation of the Role Service Access configuration.

### Combining Placeholders with Other Filters

Placeholder tokens work anywhere a value is expected in a filter expression. You can combine them with additional conditions:

```http
# Orders belonging to the current user that are in 'pending' status
GET /api/v2/mydb/_table/orders?filter=(user_id={user.id}) AND (status='pending')

# Documents the current user created, sorted newest first
GET /api/v2/mydb/_table/documents?filter=created_by={user.id}&order=created_at DESC
```

:::tip Security Best Practice
Always enforce row-level filters at the Role level (Advanced Filters) rather than relying on client-supplied filter parameters. Role-enforced filters cannot be bypassed by the API caller.
:::

---

## Best Practices

1. **Use Parameters**: Enhance security with parameter replacement
2. **Limit Results**: Always paginate large datasets
3. **Select Fields**: Only request needed fields
4. **URL Encoding**: Properly encode special characters
5. **Error Handling**: Use `rollback=true` for critical operations
6. **Test Incrementally**: Build complex filters step by step
7. **Wrap Conditions**: Always wrap logical conditions in parentheses
8. **Validate Schema**: Use `include_schema=true` to verify field names

## Troubleshooting

### Common Issues
- Wrap all logical conditions in parentheses
- Use proper quotes for string values
- Verify field names with `include_schema=true`
- Test complex filters incrementally

### Response Format
```json
{
    "resource": [
        {
            "id": 1,
            "name": "Example"
        }
    ],
    "meta": {
        "count": 1,
        "schema": {
            "name": "table_name",
            "fields": [...]
        }
    }
}
```

:::tip
Date/time formats can be configured globally in your DreamFactory configuration. Detailed documentation is available [here](/getting-started/dreamfactory-configuration/date-and-time-configuration).
:::