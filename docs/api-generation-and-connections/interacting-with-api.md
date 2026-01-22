---
sidebar_position: 3
title: Interacting With the API
id: interacting-with-the-api
description: "Learn to interact with DreamFactory APIs using HTTP clients for CRUD operations, filtering, joins, and stored procedures"
keywords: [REST API, CRUD operations, database API, HTTP requests, table joins, stored procedures, query parameters]
difficulty: "beginner"
---

# Interacting with the API

The following topic contains examples to help you become familiar with the many ways you can interact with a database-backed API. For these examples we're using the Insomnia HTTP client, however you can use any similar client or even cURL to achieve the same results.

### Retrieving all records

Let's begin by retrieving all of a particular table's records just as was done within the API Docs example. Open your client and in the address bar set the URL to `/api/v2/{service_name}/{table_name}`, replacing `{service_name}` with the name of your API and `{table_name}` with the name of a table found within the database (and to which your API key's associated role has access). For the remainder of this example we use `mysql` as the service name, and in this particular example the table we're querying is called `employees` so the URL looks like this:

```text
http://localhost/api/v2/_table/employees
```

Also, because we're retrieving records the method is set to `GET`.

Next, you must set the header which defines the API key. This header should be named `X-DreamFactory-Api-Key`. You might have to hunt around for a moment within your HTTP client to figure out where this is placed, but we promise it is definitely there. In the case of Insomnia select the **Header** tab found directly below the address bar:

<img src="/img/database-backed-api/insomnia-api-key.png" width="800" alt="Setting DreamFactory API Key Header" />

With the URL and header in place, request the URL and you should see the table records returned in JSON format:

<img src="/img/database-backed-api/insomnia-all-records.png" width="400" alt="JSON response of GET Request for All Records" />

The equivalent SQL query would look like this:

```sql
SELECT * FROM employees;
```

### Limiting results

The previous example returns all records found in the `employees` table. But what if you only wanted to return five or ten records? You can use the `limit` parameter to do so. Modify your URL to look like this:
```text
http://localhost/api/v2/_table/employees?limit=10
```
The equivalent SQL query would look like this:
```sql
SELECT * FROM employees LIMIT 10;
```
### Offsetting results

The above example limits your results found in the `employees` table to 10, but what if you want to select records 11 - 20? You would use the `offset` parameter like this:
```text
http://localhost/api/v2/_table/employees?limit=10&offset=10
```
The equivalent SQL query would look like this:
```sql
SELECT * FROM employees LIMIT 10 OFFSET 10;
```
### Ordering results

You can order results by any column using the `order` parameter. For instance to order the `employees` tab by the `emp_no` field, modify your URL to look like this:
```text
http://localhost/api/v2/_table/employees?order=emp_no
```
The equivalent SQL query looks like this:
```sql
SELECT * FROM employees ORDER BY emp_no;
```
To order in descending fashion, just append `desc` to the `order` string:
```text
http://localhost/api/v2/_table/employees?order=emp_no%20desc
```
:::note Note
The space separating `emp_no` and `desc` has been HTML encoded. Most programming languages offer HTML encoding capabilities either natively or through a third-party library so there's no need for you to do this manually within your applications. The equivalent SQL query looks like this:
:::

```sql
SELECT * FROM employees ORDER BY emp_no DESC;
```
### Selecting specific fields

Often you only require a few of the fields found in a table. To limit the fields returned, use the `fields` parameter:
```text
http://localhost/api/v2/_table/employees?fields=emp_no%2Clast_name
```
The equivalent SQL query looks like this:
```sql
SELECT emp_no, last_name FROM employees;
```
### Filtering records by condition

You can filter records by a particular condition using the `filter` parameter. For instance to return only those records having a `gender` equal to `M`, set the `filter` parameter like so:
```text
http://localhost/api/v2/_table/employees?filter=(gender=M)
```
The equivalent SQL query looks like this:
```sql
SELECT * FROM employees where gender='M';
```
You're free to use any of the typical comparison operators, such as `LIKE`:
```text
http://localhost/api/v2/_table/employees?filter=(last_name%20like%20G%25)
```
The equivalent SQL query looks like this:
```sql
SELECT * FROM employees where last_name LIKE 'G%';
```
### Combining parameters

The REST API's capabilities really begin to shine when combining multiple parameters together. For example, let's query the `employees` table to retrieve only those records having a `last_name` beginning with `G`, ordering the results by `emp_no`:
```text
http://localhost/api/v2/_table/employees?filter=(last_name%20like%20G%25)&order=emp_no
```
The equivalent SQL query looks like this:
```sql
SELECT * FROM employees where last_name LIKE 'G%' ORDER BY emp_no;
```
### Querying by primary key

You may want to select a specific record using a column that uniquely defines it. Often (but not always) this unique value is the *primary key*. You can retrieve a record using its primary key by appending the value to the URL like so:
```text
/api/v2/_table/supplies/45
```
The equivalent SQL query looks like this:
```sql
SELECT * FROM supplies where id = 5;
```
If you'd like to use this URL format to search for another unique value not defined as a primary key, you must also pass along the `id_field` and `id_type` fields like so:
```text
/api/v2/_table/employees/45abchdkd?id_field=guid&id_type=string
```
### Joining tables

One of DreamFactory's most interesting database-related features is the automatic support for table joins. When DreamFactory creates a database-backed API, it parses all of the database tables, learning everything it can about the tables, including the column names, attributes, and relationships. The relationships are assigned aliases, and presented for referential purposes within DreamFactory's `Schema` tab. For instance, the following screenshot contains the list of relationship aliases associated with the `employees` table:

<img src="/img/database-backed-api/mysql-relationships.png" width="800" alt="Joining Tables with DreamFactory" />

Using these aliases along with the `related` parameter we can easily return sets of joined records via the API. For instance, the following URI would be used to join the `employees` and `departments` tables together:
```text
/api/v2/mysql/_table/employees?related=dept_emp_by_emp_no
```
The equivalent SQL query looks like this:
```sql
SELECT * FROM employees
    LEFT JOIN departments on employees.emp_no = departments.emp_no;
```
The joined results are presented within a JSON array having a name matching that of the alias:
```json
    {
        "emp_no": 10001,
        "birth_date": "1953-09-02",
        "first_name": "Georgi",
        "last_name": "Facello",
        "gender": "M",
        "hire_date": "1986-06-26",
        "birth_year": "1953",
        "dept_emp_by_emp_no": [
            {
                "emp_no": 10001,
                "dept_no": "d005",
                "from_date": "1986-06-26",
                "to_date": "9999-01-01"
            }
        ]
    }
```

### Inserting records

To insert a record, send a `POST` request to the API, passing along a JSON-formatted payload. For instance, to add a new record to the `supplies` table, send a `POST` request to the following URI:
```text
/api/v2/mysql/_table/supplies
```
The body payload would look like this:
```json
    {
        "resource": [
            {
                "name": "Stapler"
            }
        ]
    }
```
If the request is successful, DreamFactory returns a `200` status code and a response containing the record's primary key:
```json
    {
        "resource": [
          {
            "id": 9
          }
        ]
    }
```
#### Adding records to multiple tables

If you want to create a new record and associate it with another table, you can use a single HTTP request. Consider the following two tables. The first, `supplies`, manages a list of company supplies (staplers, brooms, etc). The company requires that all supply are closely tracked in the corporate database, and so another table, `locations`, exists for this purpose. Each record in the `locations` table includes a location name and foreign key reference to a record found in the `supplies` table.

:::note Note
In the real world the location names would likely be managed in a separate table and then a join table would relate locations and supplies together. We're just trying to keep things simple for the purposes of this demonstration.
:::

The table schemas look like this:

    CREATE TABLE `supplies` (
      `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
      `name` varchar(255) DEFAULT NULL,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;

    CREATE TABLE `locations` (
      `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
      `supply_id` int(10) unsigned NOT NULL,
      `name` varchar(255) DEFAULT NULL,
      PRIMARY KEY (`id`),
      KEY `supply_id` (`supply_id`),
      CONSTRAINT `locations_ibfk_1` FOREIGN KEY (`supply_id`) REFERENCES `supplies` (`id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;

Remember from the last example that DreamFactory creates convenient join aliases which can be used in conjunction with the `related` parameter. In this case, that alias is `locations_by_supply_id`. To create the relationship alongside the new `supplies` record, use that alias to nest the location name within the payload, as demonstrated here:

```json
    {
        "resource": [
            {
                "name": "Broom",
                "locations_by_supply_id": [
                    {
                        "name": "Broom Closet"
                    }
                ]
            }
        ]
    }
```
With the payload sorted out, all that remains is to make a request to the `supplies` table endpoint:
```text
/api/v2/mysql/_table/supplies
```
If the nested insert is successful, a `200` status code is returned along with the primary key ID of the newly inserted `supplies` record:
```json
    {
        "resource": [
            {
                "id": 15
            }
        ]
    }
```
### Updating records

Updating database records is a straightforward matter in DreamFactory. However to do so you first need to determine which type of REST update you wany to perform. Two options are supported:

* **PUT**: The `PUT` request replaces an existing resource in its entirety. This means you need to pass along *all* of the resource attributes regardless of whether the attribute value is actually being modified.
* **PATCH**: The `PATCH` request updates only part of the existing resource, meaning you only need to supply the resource primary key and the attributes you'd like to update. This is typically a much more convenient update approach than `PUT`, although both have their uses.

Let's work through update examples involving each method.

#### Updating records with PUT

When updating records with `PUT` you must send along *all* of the record attributes within the request payload:
```json
    {
        "resource": [
            {
                "emp_no": 500015,
                "birth_date": "1900-12-15",
                "first_name": "Johnny",
                "last_name": "Football",
                "gender": "m",
                "hire_date": "2007-01-01"
            }
        ]
    }
```
With the payload in place, send a `PUT` request to the `employees` table endpoint:
```text
/api/v2/mysql/_table/employees
```
If successful, DreamFactory returns a `200` status code and a response body containing the primary key of the updated record:
```json
    {
        "resource": [
            {
                "emp_no": 500015
            }
        ]
    }
```
The equivalent SQL query looks like this:
```sql
    UPDATE supplies SET first_name = 'Johnny', last_name = 'Football',
    birthdate = '1900-12-15', gender = 'm', hire_date = '2007-01-01' WHERE emp_no = 500015;
```
#### Updating records with PATCH

To update one or more (but not all) attributes associated with a particular record found in the `supplies` table, send a `PATCH` request to the `supplies` table endpoint, accompanied by the primary key:
```text
/api/v2/mysql/_table/supplies/8
```
Suppose the `supplies` table includes attributes such as `name`, `description`, and `purchase_date`, but we only want to modify the `name` value. The JSON request body would look like this:
```json
    {
      "name": "Silver Stapler"
    }
```
If successful, DreamFactory returns a `200` status code and a response body containing the primary key of the updated record:
```json
    {
      "id": 8
    }
```
The equivalent SQL query looks like this:

   `UPDATE supplies SET name = 'Silver Stapler' WHERE id = 8;`

### Deleting records

To delete a record, send a `DELETE` request to the table endpoint associated with the record you'd like to delete. For instance, to delete a record from the `employees` table, reference this URL:
```text
/api/v2/mysql/_table/employees/500016
```
If deletion is successful, DreamFactory returns a 200 status code with a response body containing the deleted record's primary key:
```json
    {
        "resource": [
            {
                "emp_no": 500016
            }
        ]
    }
```
The equivalent SQL query looks like this:
```sql
DELETE FROM employees WHERE emp_no = 500016;
```

## Working with stored procedures

Stored procedure support via the REST API is just for discovery and calling what you have already created on your database, it is not for managing the stored procedures themselves. They can be accessed on each database service by the `_proc` resource.

As with most database features, there are a lot of common things about stored procedures across the various database vendors, with some notable exceptions. DreamFactory's blended API defines the difference between stored procedures and how they are used in the API as follows.

Procedures can use input parameters ('IN') and output parameters ('OUT'), as well as parameters that serve both as input and output ('INOUT'). They can, except in the Oracle case, also return data directly.

:::warning Database Vendor Exceptions
* SQLite does not support procedures (or indeed functions).
* PostgreSQL calls procedures and functions the same thing (a function) in PostgreSQL. DreamFactory calls them procedures if they have OUT or INOUT parameters or don't have a designated return type, otherwise they are referred to as functions.
* SQL Server treats OUT parameters like INOUT parameters, and therefore require some value to be passed in.
:::

### Listing available stored procedures

The following call lists the available stored procedures, based on role access allowed:
```text
GET http(s)://<dfServer>/api/v2/<serviceName>/_proc
```

### Getting stored procedure details

We can use the `ids` url parameter and pass a comma delimited list of resource names to retrieve details about each of the stored procedures. For example if you have a stored procedure named `getCustomerByLastName` a GET call to `http(s)://<dfServer>/api/v2/<serviceName>?ids=getCustomerByLastName` returns the following:
```json
{
  "resource": [
    {
      "alias": null,
      "name": "getCustomerByLastName",
      "label": "GetCustomerByLastName",
      "description": null,
      "native": [],
      "return_type": null,
      "return_schema": [],
      "params": [
        {
          "name": "LastName",
          "position": 1,
          "param_type": "IN",
          "type": "string",
          "db_type": "nvarchar",
          "length": 25,
          "precision": null,
          "scale": null,
          "default": null
        }
      ],
      "access": 31
    }
  ]
}
```

### Calling a stored procedure

#### Using GET

When passing no payload is required, any IN or INOUT parameters can be sent by passing the values in the order required inside parentheses:
```text
/api/v2/<serviceName>/_proc/myproc(val1, val2, val3)
```
Or as URL parameters by parameter name:
```text
/api/v2/<serviceName>/_proc/myproc?param1=val1&param2=val2&param3=val3
```
In the below example, there is a stored procedure `getUsernameByDepartment` which takes two input parameters, a department code, and a userID. Making the following call:
```text
/api/v2/<serviceName>/_proc/getUserNameByDepartment(AB,1234)
```
In the above example, AB is the department code and 1234 is the userID, which returns:
```json
{
  "userID": "1234",
  "username": "Tomo"
}
```

#### Using POST

If a payload is required, i.e. passing values that are not url compliant, or passing schema formatting data, include the parameters directly in order. The same call as above can be made with a POST request with the following in the body:
```json
{
  "params": ["AB", 1234]
}
```
### Formatting results

For procedures that do not have INOUT or OUT parameters, the results can be returned as is, or formatted using the returns URL parameter if the value is a single scalar value, or the schema payload attribute for result sets.

If INOUT or OUT parameters are involved, any procedure response is wrapped using the configured (a URL parameter wrapper) or default wrapper name (typically "resource"), and then added to the output parameter listing. The output parameter values are formatted based on the procedure configuration data types.

Note that without formatting, all data is returned as strings, unless the driver (i.e. mysqlnd) supports otherwise. If the stored procedure returns multiple data sets, typically via multiple "SELECT" statements, then an array of datasets (i.e. array of records) is returned, otherwise a single array of records is returned.

_schema_ - When a result set of records is returned from the call, the server uses any name-value pairs, consisting of `"<field_name>": "<desired_type>"`, to format the data to the desired type before returning.

_wrapper_ - Just like the URL parameter, the wrapper designation can be passed in the posted data.

Request with formatting configuration:
```json
{
  "schema": {
    "id": "integer",
    "complete": "boolean"
  },
  "wrapper": "data"
}
```
Response without formatting:
```json
{
  "resource": [
    {
      "id": "3",
      "name": "Write an app that calls the stored procedure.",
      "complete": 1
    },
    {
      "id": "4",
      "name": "Test the application.",
      "complete": 0
    }
  ],
  "inc": 6,
  "count": 2,
  "total": 5
}
```
Response with formatting applied:
```json
{
  "data": [
    {
      "id": 3,
      "name": "Write an app that calls the stored procedure.",
      "complete": true
    },
    {
      "id": 4,
      "name": "Test the application.",
      "complete": false
    }
  ],
  "inc": 6,
  "count": 2,
  "total": 5
}
```

### Using symmetric keys to decrypt data in a stored procedure (SQL Server)

SQL Server has the ability to perform column level encryption using symmetric keys which can be particularly useful for storing sensitive information such as passwords. A good example of how to do so can be found [here](https://www.sqlshack.com/an-overview-of-the-column-level-sql-server-encryption/)

Typically, you would then decrypt this column (assuming the user has access to the certificate) with a statement in your sql server workbench such as:
```sql
OPEN SYMMETRIC KEY SymKey
DECRYPTION BY CERTIFICATE <CertificateName>;

SELECT <encryptedColumn> AS 'Encrypted data',
CONVERT(varchar, DecryptByKey(<encryptedColumn>)) AS 'decryptedColumn'
FROM SalesLT.Address;
```

Now, we cannot call our table endpoint (e.g `/api/v2/<serviceName>/_table/<tableWithEncryptedField>`) and add this logic with DreamFactory, however we could put the same logic in a stored procedure, and have DreamFactory call that to return our decrypted result. As long as the SQLServer user has permissions to the certificate used for encryption, they are able to decrypt the field. You could then use [roles](/system-settings/dreamfactory-platform-apis/) to make sure only certain users have access to this stored procedure.

The stored procedure looks something like this: 
```sql
CREATE PROCEDURE dbo.<procedureName>
AS
BEGIN
  SET NOCOUNT on;
  OPEN SYMMETRIC KEY SymKey
  DECRYPTION BY CERTIFICATE <CertificateName>;

  SELECT <oneField>, CONVERT(nvarchar, DecryptByKey(<encryptedField>)) AS 'decrypted'
  FROM <table>;
END
return;
```
It can be called by DreamFactory with `/_proc/<procedureName>`.