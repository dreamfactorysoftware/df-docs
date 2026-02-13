# Query Parameters Reference

Common query parameters for filtering, sorting, and paginating DreamFactory API responses.

---

## filter

Filter records using SQL-like expressions.

**Syntax:** `filter={field}{operator}{value}`

### Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `=` | Equal | `filter=status='active'` |
| `!=` | Not equal | `filter=status!='deleted'` |
| `>` | Greater than | `filter=age>21` |
| `>=` | Greater or equal | `filter=created_at>='2024-01-01'` |
| `<` | Less than | `filter=price<100` |
| `<=` | Less or equal | `filter=quantity<=10` |
| `like` | Pattern match | `filter=name like 'John%'` |
| `in` | Value in list | `filter=status in ('active','pending')` |
| `is null` | Null check | `filter=deleted_at is null` |
| `is not null` | Not null check | `filter=email is not null` |

### Combining Filters

Use `and` / `or` for compound conditions:

```
filter=(status='active') and (created_at>='2024-01-01')
filter=(type='admin') or (type='superuser')
filter=((status='active') and (age>=18)) or (verified=true)
```

### Examples

**Find active users:**
```bash
curl "https://example.com/api/v2/db/_table/users?filter=status%3D'active'"
```

**Find orders over $100 from 2024:**
```bash
curl "https://example.com/api/v2/db/_table/orders?filter=(total>100)%20and%20(order_date>%3D'2024-01-01')"
```

**Search by name pattern:**
```bash
curl "https://example.com/api/v2/db/_table/contacts?filter=name%20like%20'%25smith%25'"
```

**Note:** URL-encode special characters (`=` as `%3D`, space as `%20`, `%` as `%25`).

---

## limit

Maximum number of records to return.

**Syntax:** `limit={integer}`

**Default:** Configured per-service (typically 1000)

**Examples:**

```bash
# Get first 10 records
curl "https://example.com/api/v2/db/_table/products?limit=10"

# Get first 50 matching filter
curl "https://example.com/api/v2/db/_table/orders?filter=status='pending'&limit=50"
```

---

## offset

Number of records to skip before returning results.

**Syntax:** `offset={integer}`

**Default:** 0

**Use with `limit` for pagination:**

```bash
# Page 1 (records 1-10)
curl "https://example.com/api/v2/db/_table/products?limit=10&offset=0"

# Page 2 (records 11-20)
curl "https://example.com/api/v2/db/_table/products?limit=10&offset=10"

# Page 3 (records 21-30)
curl "https://example.com/api/v2/db/_table/products?limit=10&offset=20"
```

**Pagination formula:** `offset = (page - 1) * limit`

---

## order

Sort results by one or more fields.

**Syntax:** `order={field} {direction}` or `order={field1} {dir},{field2} {dir}`

**Directions:** `ASC` (ascending), `DESC` (descending)

**Examples:**

```bash
# Sort by name ascending
curl "https://example.com/api/v2/db/_table/contacts?order=name%20ASC"

# Sort by date descending (newest first)
curl "https://example.com/api/v2/db/_table/orders?order=created_at%20DESC"

# Multi-column sort
curl "https://example.com/api/v2/db/_table/products?order=category%20ASC,price%20DESC"
```

---

## fields

Select specific fields to return (reduces payload size).

**Syntax:** `fields={field1},{field2},{field3}`

**Examples:**

```bash
# Return only id, name, email
curl "https://example.com/api/v2/db/_table/users?fields=id,name,email"

# Combine with filter
curl "https://example.com/api/v2/db/_table/orders?filter=status='pending'&fields=id,total,customer_id"
```

**Default:** All fields returned if not specified.

---

## related

Include related records from foreign key relationships.

**Syntax:** `related={table_name}` or `related={table1},{table2}`

**Examples:**

```bash
# Get orders with customer data
curl "https://example.com/api/v2/db/_table/orders?related=customers"

# Get products with category and supplier
curl "https://example.com/api/v2/db/_table/products?related=categories,suppliers"
```

**Response includes nested related data:**

```json
{
  "resource": [
    {
      "id": 1,
      "product_name": "Widget",
      "category_id": 5,
      "categories_by_category_id": {
        "id": 5,
        "name": "Electronics"
      }
    }
  ]
}
```

### Filtering Related Data

Use dot notation to filter on related fields:

```bash
curl "https://example.com/api/v2/db/_table/orders?related=customers&filter=customers.country='USA'"
```

---

## include_count

Include total record count in response (useful for pagination UI).

**Syntax:** `include_count=true`

**Response includes meta field:**

```json
{
  "resource": [...],
  "meta": {
    "count": 1523
  }
}
```

**Example with pagination:**

```bash
curl "https://example.com/api/v2/db/_table/products?limit=10&offset=0&include_count=true"
```

**Note:** May impact performance on large tables. Use sparingly.

---

## ids

Filter by primary key values (alternative to filter for simple lookups).

**Syntax:** `ids={id1},{id2},{id3}`

**Examples:**

```bash
# Get specific records by ID
curl "https://example.com/api/v2/db/_table/users?ids=1,5,10,15"

# Delete multiple records
curl -X DELETE "https://example.com/api/v2/db/_table/temp_data?ids=100,101,102"
```

---

## id_field

Specify which field to use as the identifier (when not using default primary key).

**Syntax:** `id_field={field_name}`

**Example:**

```bash
curl "https://example.com/api/v2/db/_table/products?ids=SKU001,SKU002&id_field=sku"
```

---

## group

Group results by field values (for aggregate queries).

**Syntax:** `group={field}` or `group={field1},{field2}`

**Example:**

```bash
curl "https://example.com/api/v2/db/_table/orders?group=status&fields=status,count(*)"
```

---

## having

Filter grouped results (use with `group`).

**Syntax:** `having={condition}`

**Example:**

```bash
curl "https://example.com/api/v2/db/_table/orders?group=customer_id&fields=customer_id,sum(total)&having=sum(total)>1000"
```

---

## count_only

Return only the total record count, not the records themselves.

**Syntax:** `count_only=true`

**Example:**

```bash
curl "https://example.com/api/v2/db/_table/users?filter=status='active'&count_only=true"
```

**Response:**
```json
{
  "meta": {
    "count": 1523
  }
}
```

---

## Parameter Aliases

Some parameters have alternative names for convenience:

| Parameter | Aliases |
|-----------|---------|
| `fields` | `select` |
| `filter` | `where` |
| `limit` | `top` |
| `offset` | `skip` |
| `order` | `sort`, `order_by` |
| `group` | `group_by` |

---

## Complete Examples

### Paginated List with Count

```bash
curl "https://example.com/api/v2/db/_table/products\
?limit=20\
&offset=40\
&order=name%20ASC\
&include_count=true\
&fields=id,name,price,stock"
```

### Filtered Search with Related Data

```bash
curl "https://example.com/api/v2/db/_table/orders\
?filter=(status='pending')%20and%20(total>100)\
&related=customers\
&order=created_at%20DESC\
&limit=50"
```

### Minimal Payload for Dropdown

```bash
curl "https://example.com/api/v2/db/_table/categories\
?fields=id,name\
&order=name%20ASC\
&filter=active=true"
```

---

## URL Encoding Reference

| Character | Encoded |
|-----------|---------|
| Space | `%20` or `+` |
| `=` | `%3D` |
| `'` | `%27` |
| `%` | `%25` |
| `&` | `%26` |
| `(` | `%28` |
| `)` | `%29` |
| `,` | `%2C` |

**Tip:** Use your HTTP client's built-in URL encoding rather than manual encoding.

---

## See Also

- [API Endpoints](api-endpoints.md) - Complete endpoint reference
- [Error Codes](error-codes.md) - HTTP status codes and error handling
