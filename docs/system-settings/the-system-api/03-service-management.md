---
sidebar_position: 3
title: Service Management
id: service-management
description: "Create and manage API services programmatically using DreamFactory's System API for automated deployments"
keywords: [service management, system API, API automation, service types, database API, scripted deployment]
difficulty: "intermediate"
---

# Service Management

Creating a service will no doubt be the first key component when you are using DreamFactory to handle your API management needs. The below example will be for a Database API, but the logic is fundamentally the same for any kind of service that you will create.

## Retrieving Service Types and Configuration Schemas

Each service type naturally requires a different configuration schema. For instance most database service types require that a host name, username, and password are provided, whereas the AWS S3 service type requires an AWS access key ID, secret access key, and AWS region. You can obtain a list of supported service types and associated configuration schemas by issuing a GET request to `/api/v2/system/service_type`.

**Endpoint:** `GET https://{url}/api/v2/system/service_type`

**Curl Equivalent:**
```bash
curl -X GET "https://{url}/api/v2/system/service_type" -H "accept: application/json" \
-H "X-DreamFactory-Session-Token: <session_token>"
```

This will return a rather lengthy response containing the names and configuration schemas, a tiny portion of which is recreated here:

```json
{
  "resource": [
    {
      "name": "adldap",
      "label": "Active Directory",
      "description": "A service for supporting Active Directory integration",
      "group": "LDAP",
      "singleton": false,
      "dependencies_required": null,
      "subscription_required": "SILVER",
      "service_definition_editable": false,
      "config_schema": [
        {
          "alias": null,
          "name": "host",
          "label": "Host",
          "description": "The host name for your AD/LDAP server.",
          "native": [],
          "type": "string",
          "length": 255
        }
      ]
    }
  ]
}
```

If you just want to retrieve a list of service type names, issue the same GET request but with the `fields=name` parameter attached:

```text
/api/v2/system/service_type?fields=name
```

This will return a list of service type names:

```json
{
  "resource": [
    {
      "name": "adldap"
    },
    {
      "name": "amqp"
    },
    {
      "name": "apns"
    },
    ...
    {
      "name": "user"
    },
    {
      "name": "v8js"
    },
    {
      "name": "webdav_file"
    }
  ]
}
```

Then, if you wish to see the config details for a particular service, you can add it to the end of the url. For example, to see the config details for a MySQL service:

**Endpoint:** `GET http://{url}/api/v2/system/service_type/mysql`

This will return:

```json
{
  "name": "mysql",
  "label": "MySQL",
  "description": "Database service supporting MySQL connections.",
  "group": "Database",
  "singleton": false,
  "dependencies_required": null,
  "subscription_required": "SILVER",
  "service_definition_editable": false,
  "config_schema": [
    {
      "name": "host",
      "label": "Host",
      "type": "string",
      "description": "The name of the database host, i.e. localhost, 192.168.1.1, etc."
    },
    {
      "name": "port",
      "label": "Port Number",
      "type": "integer",
      "description": "The number of the database host port, i.e. 3306"
    },
    {
      "name": "database",
      "label": "Database",
      "type": "string",
      "description": "The name of the database to connect to on the given server. This can be a lookup key."
    },
    {
      "name": "username",
      "label": "Username",
      "type": "string",
      "description": "The name of the database user. This can be a lookup key."
    }
  ]
}
```

## Create a Database API

To create a database API, you'll send a POST request to the `/api/v2/system/service` endpoint. The request payload will contain all of the API configuration attributes. For instance this payload reflects what would be required to create a MySQL API:

**Endpoint:** `POST https://{url}/api/v2/system/service`

**Request Body:**
```json
{
  "resource": [
    {
      "id": null,
      "name": "mysql",
      "label": "MySQL API",
      "description": "MySQL API",
      "is_active": true,
      "type": "mysql",
      "config": {
        "max_records": 1000,
        "host": "HOSTNAME",
        "port": 3306,
        "database": "DATABASE",
        "username": "USERNAME",
        "password": "PASSWORD"
      },
      "service_doc_by_service_id": null
    }
  ]
}
```

**Curl Equivalent:**
```bash
curl -X POST "http://localhost/api/v2/system/service" -H "accept: application/json" \
-H "Content-Type: application/json" -H "X-DreamFactory-Session-Token: <session_token>" \
-d "{\"resource\":[{\"id\":null,\"name\":\"mysql\",\"label\":\"MySQL API\", \
\"description\":\"MySQL API\",\"is_active\":true,\"type\":\"mysql\", \
\"config\":{\"max_records\":1000,\"host\":\"HOSTNAME\",\"port\":3306, \
\"database\":\"DATABASE\",\"username\":\"USERNAME\",\"password\":\"PASSWORD\"}, \
\"service_doc_by_service_id\":null}]}"
```

After submitting a successful request, a 201 Created status code is returned along with the newly created service's ID:

```json
{
  "resource": [
    {
      "id": 194
    }
  ]
}
```

## Retrieve API Details

To retrieve configuration details about a specific API, issue a GET request to `/api/v2/system/service`. You can pass along either an API ID or the API name (namespace). For instance to retrieve a service configuration by ID, you'll pass the ID like this:

```text
/api/v2/system/service/8
```

It is likely more natural to reference an API by its namespace. You can pass the name in using the filter parameter:

```text
/api/v2/system/service?filter=name=mysql
```

In both cases, the response will look like this:

```json
{
  "resource": [
    {
      "id": 8,
      "name": "mysql",
      "label": "MySQL API",
      "description": "MySQL API",
      "is_active": true,
      "type": "mysql",
      "mutable": true,
      "deletable": true,
      "created_date": "2019-02-27 02:14:17",
      "last_modified_date": "2019-08-20 20:40:15",
      "created_by_id": "1",
      "last_modified_by_id": "3",
      "config": {
        "service_id": 8,
        "options": null,
        "attributes": null,
        "statements": null,
        "host": "database.dreamfactory.com",
        "port": 3306,
        "database": "employees",
        "username": "demo",
        "password": "**********",
        "schema": null,
        "charset": null,
        "collation": null,
        "timezone": null,
        "modes": null,
        "strict": null,
        "unix_socket": null,
        "max_records": 1000,
        "allow_upsert": false,
        "cache_enabled": false,
        "cache_ttl": 0
      }
    }
  ]
}
```

## Creating a Scripted API Deployment Solution

Now that you understand how to create and query DreamFactory-managed APIs, your mind is probably racing regarding all of the ways at least some of your administrative tasks can be automated. Indeed, there are many different ways to accomplish this, because all modern programming languages support the ability to execute HTTP requests. In fact, you might consider creating a simple shell script that executes curl commands.

:::tip Automation Benefits
Scripted deployment solutions offer several advantages:
- **Consistency**: Identical configurations across environments
- **Speed**: Rapid deployment of complex API setups
- **Version Control**: Track configuration changes over time
- **Error Reduction**: Eliminate manual configuration mistakes
:::

Begin by creating a JSON file that contains the service creation request payload:

```json
{
    "resource": [
        {
            "id": null,
            "name": "mysqltest09032019",
            "label": "mysql test",
            "description": "mysql test",
            "is_active": true,
            "type": "mysql",
            "config": {
                "max_records": 1000,
                "host": "HOSTNAME",
                "port": 3306,
                "database": "DATABASE",
                "username": "USERNAME",
                "password": "PASSWORD"
            },
            "service_doc_by_service_id": null
        }
    ]
}
```

Name this file `mysql-production.json`, and don't forget to update the authentication placeholders. Next, create a shell script that contains the following code:

```bash
#!/bin/bash

curl -d @mysql-production.json \
    -H "Content-Type: application/json" \
    -H "X-DreamFactory-Api-Key: YOUR_API_KEY" \
    -X POST https://YOUR_DOMAIN_HERE/api/v2/system/service
```

Save this script as `create-service.sh` and then update the permissions so it's executable before running it:

```bash
$ chmod u+x create-service.sh
$ ./create-service.sh
{"resource":[{"id":196}]}
```

Of course, this is an incredibly simple example which can be quickly built upon to produce a more robust solution. For instance you might create several JSON files, one for development, testing, and production, and then modify the script to allow for environment arguments:

```bash
$ ./create-service.sh production
```

## Clear the DreamFactory Service Cache

For performance purposes DreamFactory caches all service definitions so the configuration doesn't have to be repeatedly read from the system database. Therefore when editing a service you'll need to subsequently clear the service cache in order for your changes to take effect.

To clear the cache for a specific service, issue a DELETE request to the following URI, appending the service ID to it:

```text
/api/v2/system/admin/session/8
```

To clear the cache for all defined services, issue a DELETE request to the following URI:

```text
/api/v2/system/admin/session
```
