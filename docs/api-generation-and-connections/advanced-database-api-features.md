---
title: "Advanced Database API Features"
linkTitle: "Advanced Database API Features"
weight: 5
description: "Use database transactions, functions, virtual fields, and virtual relationships (including cross-service joins) to extend DreamFactory API capabilities"
keywords: [database transactions, SQL functions, virtual fields, virtual relationships, cross-service joins, virtual foreign keys, rollback, nested inserts, data transformation]
difficulty: "advanced"
---

[Generating a Database-backed API](./api-types/database/generating-database-backed-api.md) provides a solid introduction to carrying out CRUD operations in conjunction with a DreamFactory-generated API, however you're going to need some additional firepower in order to successfully integrate these APIs into your projects. This chapter introduces several of DreamFactory's advanced database API-related features, covering topics such as database transactions, calling database functions via API endpoints, and more.

## Using Database Transactions in API Calls

Popular databases such as MySQL, PostgreSQL, and SQL Server support transactions, which allow you to treat a group of SQL operations as a single unit. Should any of the SQL statements in this unit fail, then all previously executed statements will be reverted, or rolled back. For instance, imagine several database tables are used to manage company supply inventory and the supply locations. The table creation statements might look like this:

```
CREATE TABLE `supplies` (
  id INT(11) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
);
```

```
CREATE TABLE locations (
  id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name varchar(100) not null,
  supply_id INT unsigned,
  CONSTRAINT fk_supply
  FOREIGN KEY (supply_id)
     REFERENCES supplies(id)
);
```

Based on this configuration, each supply has one location. I'm purposefully keeping the schema simple; you might imagine for instance the `supplies` table includes a barcode field for tracking each piece of inventory.

When adding a new supply to the `supplies` table, it's critical to also add the supply's location otherwise we won't know where it resides. Sounds like a perfect opportunity to use a database transaction, because of either query fails, we want the other query to be reverted (rolled back) so the query issue can be fixed. If it isn't rolled back we run the risk of inserting an orphaned record.

DreamFactory supports nested inserts, allowing you to easily insert records into multiple tables via a single API call. If we wanted to insert a new supply and its location, we would issue a POST call to the `.../_table/supplies` endpoint, passing along the following JSON payload:

```
{
  "resource": [
  {
    "name": "Stapler",
    "locations_by_supply_id": [
      {
        "name": "Closet"
      }
    ]
  }
]
}
```

After executing the call, check your database and you'll see new records in both the `supplies` and `locations` tables. Now change the payload, swapping out the `locations` `name` field with `title`:

```
{
  "resource": [
  {
    "name": "Stapler",
    "locations_by_supply_id": [
      {
        "title": "Closet"
      }
    ]
  }
]
}
```

The database doesn't recognize the `title` column, meaning it won't accept the INSERT statement. That SQL statement would look like this:

```
INSERT INTO locations(id, title, supply_id) VALUES(NULL, "Closet", 55);
```

When the insertion fails, DreamFactory will return the following error:

```
Failed to update many to one assignment. 
Batch Error: Not all requested records could be created.
```

Fair enough. It is however critical to understand that while the supply/location mapping failed, the stapler record was in fact added to the `supplies` table and is now orphaned due to lack of location. Fortunately, it's very easy to remedy this by telling DreamFactory to encapsulate these INSERT requests in a transaction. This is done by appending `rollback=true` to the API call URI:

```
.../_table/supplies?rollback=true
```

Now call the endpoint again with the errant payload. You'll still receive the specified error, however the designated supply wasn't added to the supplies table because it was rolled back due to the failed `locations` table insertion attempt.

## Using Database Functions in API Calls

All commonly used databases support a wide array of functions that can be used to manipulate result sets before returning data to the client as well as input before being written to the database. For instance, our demo MySQL database is based off the official [MySQL example database](https://dev.mysql.com/doc/employee/en/). It includes tables containing employees, departments, salaries, sales data, and so forth. The `sales` table looks like this:

```
CREATE TABLE `sales` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` int(10) unsigned DEFAULT NULL,
  `product_name` varchar(100) DEFAULT NULL,
  `sold_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
);
```

The `sales` table includes a `sold_at` field that has a timestamp datatype. Therefore when retrieving data from this table via an API call, you'll receive JSON output like this:

```
{
  "resource": [
    {
      "id": 1,
      "customer_id": 456,
      "product_name": "Water bottle",
      "sold_at": "2021-07-19 17:34:20"
    },
    {
      "id": 2,
      "customer_id": 343,
      "product_name": "Knapsack",
      "sold_at": "2021-07-19 17:34:32"
    }
  ]
}
```

However suppose you don't need that level of granularity and just want the date a product was sold. When writing SQL, you can use MySQL's `date()` function to convert the timestamp:

```
select product_name, date(sold_at) from sales;
```

Using the `date()` function is easy enough when writing standard SQL. But how would this be accomplished via an API call? Fortunately, DreamFactory's `Schema` tab (located at Admin Settings > Schema) offers a very easy way to modify column formatting using a database function. Click on the Schema tab, select your database-based service, and then choose a table. You'll see a section named `Fields` that itemizes each column found in that table:

<img src="/img/api-generation-and-connections/advanced-db-features/table-columns.png" alt="DreamFactory table columns" />

Click on a field such as `sold_at` and scroll to the bottom of the column detail page. You'll find a section named `DB Function Use`. Click the `+` button and you'll be able to modify the column output via a database function:

<img src="/img/api-generation-and-connections/advanced-db-features/column-db-function-use.png" alt="DreamFactory DB functions" />

You can use the select box to determine when the database function is applied, meaning you can use different functions according to which HTTP method is used in conjunction with the endpoint call.

The function is applied according to its use:

| Use | When it runs | How to write it |
|-----|--------------|-----------------|
| `SELECT` | Reading records | A SQL expression that references the column by name, for example `date(sold_at)`. The result is returned under the field's name. |
| `FILTER` | The field appears in a `filter` parameter | A SQL expression that replaces the column reference in the `WHERE` clause. |
| `INSERT` | Creating records | A SQL expression with a `{value}` placeholder. DreamFactory replaces `{value}` with the quoted value from the request, for example `UPPER({value})`. |
| `UPDATE` | Updating records | Same as `INSERT`, using `{value}`. |

For example, to expose a PostGIS `geometry` column as GeoJSON, use `ST_AsGeoJSON(location)` for `SELECT` and `ST_GeomFromGeoJSON({value})` for `INSERT` and `UPDATE`.

Once configured the `sales` table API call will now return a response that looks like this:

```
{
  "resource": [
    {
      "id": 1,
      "customer_id": 456,
      "product_name": "Water bottle",
      "sold_at": "2021-07-19"
    },
    {
      "id": 2,
      "customer_id": 343,
      "product_name": "Knapsack",
      "sold_at": "2021-07-19"
    }
  ]
}
```

### Creating a Virtual Field

There's a second database function-related feature that can prove useful in certain situations. Suppose you didn't want to modify an existing field value using a database function, but instead want to create a new virtual field for this purpose. As an example, consider the following `employees` table:

```
CREATE TABLE `employees` (
  `emp_no` int(11) NOT NULL,
  `birth_date` date NOT NULL,
  `first_name` varchar(14) NOT NULL,
  `last_name` varchar(16) NOT NULL,
  `gender` enum('M','F') NOT NULL,
  `hire_date` date NOT NULL,
  PRIMARY KEY (`emp_no`)
);
```

Note how it breaks each employee's name into first and last fields. But what if you wanted to concatenate the employees' first name and last names together before returning the results? You can use MySQL's `concat()` function to do so:

```
select concat(`first_name`, " ", `last_name`) from employees;
```

You still probably want the option of retrieving the first and last name in some use cases, but also retrieving the concatenated name in others. To do so, you can create a *virtual field*. Click on the `Schema` tab and choose the service and table you'd like to modify. Then click the `Add Field` (purple circle with +) button:

<img src="/img/api-generation-and-connections/advanced-db-features/fields-add-field.png" alt="Adding a virtual field" />

On this screen you'll define the virtual field. To do so, it is critically important that you click the `Is Virtual?` checkbox. Neglecting to do so will prompt DreamFactory to alter the actual database schema! In most cases this will fail due to the connecting user not possessing sufficient permissions, however if the connecting user is assigned alter privileges then the table will in fact be modified. Additionally assign a field name, label, and column type:

<img src="/img/api-generation-and-connections/advanced-db-features/virtual-field.png" alt="Defining a virtual field" />


Next, scroll to the bottom of the screen and add a new database function entry. To concatenate the `first_name` and `last_name` fields together I've used the following function:

```
concat(`first_name`, " ", `last_name`)
```

After saving the changes, subsequent calls to the `employees` table endpoint will produce JSON that looks like this:

```
{
  "resource": [
    {
      "emp_no": 111,
      "birth_date": "1953-09-02",
      "first_name": "Steve",
      "last_name": "Smith",
      "gender": "M",
      "hire_date": "1986-06-26",
      "name": "Steve Smith"
    }
  ]
}
```

You can also nest functions. For instance we can convert the first and last names to all capital letters and subsequently concatenate them together using this statement:

```
concat(UPPER(`first_name`), " ", UPPER(`last_name`))
```

Once in place, subsequent calls to the `employees` table endpoint will produce JSON that looks like this:

```
{
  "resource": [
    {
      "emp_no": 111,
      "birth_date": "1953-09-02",
      "first_name": "Steve",
      "last_name": "Smith",
      "gender": "M",
      "hire_date": "1986-06-26",
      "name": "STEVE SMITH"
    }
  ]
}
```

## Virtual Relationships and Cross-Service Joins

DreamFactory discovers relationships from the foreign keys in your database and makes them available through the `related` parameter (see [Joining tables](./interacting-with-api.md#joining-tables)). When a relationship has no foreign key behind it, you can define it yourself as a *virtual relationship*. DreamFactory stores the definition in its own system database, so nothing changes in your database.

A virtual relationship can point at a table in a **different service**. This is how you join data across two databases, for example `orders` in MySQL with `customers` in PostgreSQL, in a single API call.

### Creating a virtual relationship in the admin console

1. Open the `Schema` tab, select the database service, and choose the table.
2. In the `Relationships` section, click `Add Virtual Relationship`.
3. Choose the relationship type, the local field, the referenced service, the referenced table, and the referenced field. For `many_many`, also choose the junction service, table and fields.
4. Save the relationship.

### Creating a virtual relationship with the API

Send a `POST` to the table's `_related` schema resource on the service that owns the local table. This example links `orders.customer_id` in the `mysql` service to `customers.id` in the `crm` service:

```http
POST /api/v2/mysql/_schema/orders/_related
Content-Type: application/json

{
  "resource": [
    {
      "type": "belongs_to",
      "is_virtual": true,
      "field": "customer_id",
      "ref_service_id": 7,
      "ref_table": "customers",
      "ref_field": "id"
    }
  ]
}
```

`ref_service_id` is the numeric ID of the referenced service. You can look it up with `GET /api/v2/system/service?filter=name=crm&fields=id,name`. If you leave `ref_service_id` out, DreamFactory uses the same service as the local table.

| Property | Required for | Description |
|----------|--------------|-------------|
| `type` | all | `belongs_to`, `has_one`, `has_many`, or `many_many`. |
| `is_virtual` | all | Must be `true`. |
| `ref_table` | all | The referenced table. |
| `field` | `belongs_to`, `many_many` | The local field. |
| `ref_field` | `has_one`, `has_many`, `many_many` | The field in the referenced table. |
| `ref_service_id` | optional | The service that holds `ref_table`. Defaults to the local service. |
| `junction_service_id` | optional, `many_many` | The service that holds the junction table. Defaults to the local service. |
| `junction_table` | `many_many` | The junction table. |
| `junction_field` | `many_many` | The junction field that points at the local table. |
| `junction_ref_field` | `many_many` | The junction field that points at the referenced table. |
| `ref_on_update`, `ref_on_delete` | optional | Referential actions to record with the relationship. |

DreamFactory rejects a definition that is missing a required property for its type.

### Using the relationship

DreamFactory generates a name for the relationship in the form `{ref_table}_by_{field}`. When the referenced table is in another service, the service name is prefixed, for example `crm.customers_by_customer_id`. To list the names, call `GET /api/v2/mysql/_schema/orders/_related`.

Pass the name in the `related` parameter, exactly as you would for a foreign-key relationship:

```http
GET /api/v2/mysql/_table/orders?related=crm.customers_by_customer_id
```

Each order in the response includes its customer record from the `crm` service.

### How cross-service joins work

The join happens in DreamFactory, not in the database. DreamFactory first reads the local records, then collects the key values and requests the matching records from the referenced service with an `IN` filter, and then merges the results. Keep these points in mind:

- Each relationship adds one more query per request. On large result sets, use `limit` and `fields` to keep both queries small.
- Relationships on multi-column keys are not supported.

