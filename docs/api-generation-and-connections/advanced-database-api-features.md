---
title: "Advanced Database API Features"
linkTitle: "Advanced Database API Features"
weight: 5
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