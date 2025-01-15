---
id: filtering
title: Querying and Filtering Records in DreamFactory
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Querying and Filtering Records in DreamFactory

:::warning

This page is under construction.

:::

## Overview
DreamFactory provides powerful filtering capabilities for database operations, allowing you to precisely query and manipulate your data through the REST API.

## Basic Endpoint Structure
```bash
GET https://{your-dreamfactory-url}/api/v2/{api_name}/_table/{table_name}?filter={filter_string}
```

### URL Components
| Component | Description | Example |
|-----------|-------------|---------|
| `api_name` | Name of your API service | `mysql`, `postgres` |
| `table_name` | Database table to query | `customers`, `orders` |
| `filter_string` | URL-encoded filter expression | `(status='active')` |

## Filter Syntax

### Logical Operators
All logical conditions must be wrapped in parentheses. For example: 
`(a=b) AND ((c=d) OR (e=f))` or `NOT((a=b) OR (c=d))`

| Operator | Description | Example | URL Example |
|----------|-------------|---------|-------------|
| `AND` | Returns TRUE when both conditions are TRUE | `(first_name='John') AND (age>21)` | `?filter=(first_name='John') AND (age>21)` |
| `OR` | Returns TRUE if either condition is TRUE | `(status='active') OR (status='pending')` | `?filter=(status='active') OR (status='pending')` |
| `NOT` | Negates the following condition | `NOT(status='deleted')` | `?filter=NOT(status='deleted')` |

### Comparison Operators

:::note
Your HTTP client will automatically handle URL encoding of special characters in the filter string.
:::

#### Basic Comparisons
| Operator | Alternatives | Description | Example | URL Example |
|----------|-------------|-------------|---------|-------------|
| `=` | `EQ` | Equality | `status = 'active'` | `?filter=(status = 'active')` |
| `!=` | `NE`, `<>` | Inequality | `status != 'deleted'` | `?filter=(status != 'deleted')` |
| `>` | `GT` | Greater than | `age > 21` | `?filter=(age > 21)` |
| `>=` | `GTE` | Greater than or equal | `price >= 100` | `?filter=(price >= 100)` |
| `<` | `LT` | Less than | `quantity < 5` | `?filter=(quantity < 5)` |
| `<=` | `LTE` | Less than or equal | `date <= '2024-01-01'` | `?filter=(date <= '2024-01-01')` |

#### Set Operations
| Operator | Description | Example | URL Example |
|----------|-------------|---------|-------------|
| `IN` | Matches any value in a set | `status IN ('active','pending')` | `?filter=(status IN ('active','pending'))` |
| `NOT IN` | Excludes values in a set | `category NOT IN ('archived','deleted')` | `?filter=(category NOT IN ('archived','deleted'))` |

#### Pattern Matching
| Operator | Description | Example | URL Example |
|----------|-------------|---------|-------------|
| `LIKE` | Generic pattern matching using `%` | `email LIKE '%@company.com'` | `?filter=(email LIKE '%@company.com')` |
| `CONTAINS` | Contains string (v2.1.1+) | `description CONTAINS 'important'` | `?filter=(description CONTAINS 'important')` |
| `STARTS WITH` | Begins with string (v2.1.1+) | `name STARTS WITH 'App'` | `?filter=(name STARTS WITH 'App')` |
| `ENDS WITH` | Ends with string (v2.1.1+) | `file ENDS WITH '.pdf'` | `?filter=(file ENDS WITH '.pdf')` |

## Query Parameters

### Field Selection
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `fields` | String/Array | Specify which fields to return | `?fields=id,name,status` |
| `include_count` | Boolean | Include total record count in response | `?include_count=true` |
| `include_schema` | Boolean | Include table schema in response | `?include_schema=true` |

### Pagination and Ordering
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `limit` | Integer | Maximum number of records to return | `?limit=10` |
| `offset` | Integer | Number of records to skip | `?offset=20` |
| `order` | String | Field to order results by (with direction) | `?order=name ASC` |
| `group` | String | Field to group results by | `?group=category` |

### Batch Operations
| Parameter | Type | Description |
|-----------|------|-------------|
| `continue` | Boolean | Continue processing batch even after failures |
| `rollback` | Boolean | Rollback all changes if any operation fails |

## Advanced Features

### Using Parameters in Filters
You can use replacement parameters in your filters for better security and reusability:

```bash
# Filter with parameter
?filter=status=:status_param

# Request body
{
    "params": {
        ":status_param": "active"
    }
}
```

### Date and Time Handling
DreamFactory supports consistent date/time formatting across different database types:

| Type | Example Format | Configuration Key |
|------|---------------|-------------------|
| Time | `09:45:00` | `time_format` |
| Date | `2003-01-16` | `date_format` |
| DateTime | `2014-03-14 13:34:00` | `datetime_format` |
| Timestamp | `2014-12-11T14:11:27Z` | `timestamp_format` |

:::tip
Date/time formats can be configured globally in your DreamFactory configuration.
:::

## Response Format

### Standard Response
```json
{
    "resource": [
        {
            "id": 352,
            "name": "Example Record"
        }
    ]
}
```

### Response with Metadata
```json
{
    "resource": [
        {
            "id": 352,
            "name": "Example Record"
        }
    ],
    "meta": {
        "count": 8,
        "schema": {
            "name": "table_name",
            "fields": [...]
        }
    }
}
```

## Common Examples

### Complex Filtering

#### Multiple conditions

```bash
?filter=(status='active') AND (created_date>='2024-01-01')
```

#### Using IN clause

```bash
?filter=status IN ('active','pending')
```

#### Date filtering with parameters

```bash
?filter=created_date>=:start_date
```
### Pagination with Ordering

#### Get second page of 10 records, sorted by name

```bash
?limit=10&offset=10&order=name ASC
```

#### Include total count

```bash
?limit=10&offset=0&include_count=true
```

## Best Practices

1. **Use Parameters**: Always use parameter replacement for values in filters when possible
2. **Limit Results**: Include `limit` and `offset` for large datasets
3. **Select Fields**: Specify needed fields using `fields` parameter to reduce payload size
4. **URL Encoding**: Ensure complex filters are properly URL encoded
5. **Batch Operations**: Use `rollback=true` for critical batch operations

## Troubleshooting

### Common Issues
- Ensure all logical conditions are wrapped in parentheses
- Check that string values are properly quoted
- Verify URL encoding for special characters
- Confirm date formats match your configuration

### Debugging Tips
- Use `include_schema=true` to verify field names
- Test complex filters in parts
- Check response metadata for error details
