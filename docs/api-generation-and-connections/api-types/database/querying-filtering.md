---
sidebar_position: 2
title: Querying and Filtering Records
id: querying-and-filtering
description: Learn how to query, filter, sort, and paginate database records using DreamFactory's REST API
keywords: [database query, API filtering, REST API query, pagination, sorting, SQL filter, LIKE operator, IN operator]
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