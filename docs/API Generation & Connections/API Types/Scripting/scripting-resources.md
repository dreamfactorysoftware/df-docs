---
sidebar_position: 1
---

# Scripting resources


This page provides a comprehensive overview of the resources available for scripting in DreamFactory, including links to sample scripts and documentation references for event scripting and scripted services.

## Overview

DreamFactory's scripting capabilities allow you to extend the functionality of your APIs by executing custom scripts in response to events or as standalone services. These scripts can be written in various supported languages and can interact with the DreamFactory platform to perform complex operations.

## Supported Scripting Languages

DreamFactory offers an extraordinarily powerful solution for creating APIs and adding business logic to existing APIs using a variety of popular scripting languages including PHP, Python, Node.js, and JavaScript. In this section we walk through several examples to spur your imagination regarding the many ways you can take advantage of this great feature.

## Supported scripting languages
DreamFactory has several scripting languages available for customized scripting of endpoints and services. To get a list of the currently supported and configured scripts on a particular instance, use the API endpoint:

DreamFactory supports several scripting languages:

- **Node.js**: Server-side JavaScript handler using the Node.js engine.
- **PHP**: Script handler using native PHP.
- **Python**: Script handler using native Python.
- **Python3**: Script handler using native Python3.

## Programmatic Resources Available to Scripts

When a script is executed, DreamFactory provides two primary resources:

- **Event Resource**: Contains data about the event triggering the script.
- **Platform Resource**: Allows access to configuration, system states, and internal API calls.

### Event Resource

The following languages are typically supported on DreamFactory installations

The event resource includes properties such as `request`, `response`, and `resource`, which represent the inbound REST API call, the response, and any additional resource names, respectively.


| **Property** | **Type** | **Description**                                                                                                                    |
| ------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **request**  | resource | Represents the inbound REST API call, i.e. the HTTP request                                                                        |
| **response** | resource | Represents the response to an inbound REST API call, i.e the HTTP response                                                         |
| **resource** | string   | Any additional resource names typically represented as a replaceable part of the path, i.e. `table name` on a `db/_table/{table_name}` call |

#### Event Request

The **request** resource contains all the components of the original HTTP request. This resource is always available, and is writable during pre-process event scripting.

| **Property**      | **Type**     | **Description**                                                                                                                                                          |
| ----------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **api_version**   | string       | The API version used for the request (i.e. 2.0).                                                                                                                         |
| **method**        | string       | The HTTP method of the request (i.e. GET, POST, PUT).                                                                                                                    |
| **parameters**    | resource     | An object/array of query string parameters received with the request, indexed by the parameter name.                                                                     |
| **headers**       | resource     | An object/array of HTTP headers from the request, indexed by the lowercase header name. Including content-length, content-type, user-agent, authorization, and host.     |
| **content**       | string       | The body of the request in raw string format.                                                                                                                            |
| **content_type**  | string       | The format type (i.e. “application/json”) of the raw content of the request.                                                                                             |
| **payload**       | resource     | The body (POST body) of the request, i.e. the content, converted to an internally usable object/array if possible.                                                       |
| **uri**           | string       | Resource path, i.e. /api/v2/php.                                                                                                                                         |
| **service**       | string       | The type of service, i.e. php, nodejs, python.                                                                                                                           |

## Where to use DreamFactory scripting

Scripts can be used in two places in DreamFactory, ***Event Scripts*** and ***Scripted APIs***. ***Event Scripts*** is tied to and triggered by API calls, internal events, or other scrips. The other way scripts are used is through customize-able script APIs. There is a scripting API type for each supporting scripting language listed above.

## Programatic resources available to a script

When a script is executed, DreamFactory passes the script(s) two primary resources to allow the script to access many parts of the system, including the state, configuration and even the ability to call other internal or external APIs. They are the **event** and **platform** resources described below.


#### Event Response


The **response** resource contains the data being sent back to the client from the request.

| **Property**      | **Type**     | **Description**                                                                                    |
| ----------------- | ------------ | -------------------------------------------------------------------------------------------------- |
| **status_code**   | integer      | The HTTP status code of the response (i.e. 200, 404, 500, etc).                                    |
| **headers**       | resource     | An object/array of HTTP headers for the response back to the client.                               |
| **content**       | mixed        | The body of the request as an object if the content\_type is not set, or in raw string format.     |
| **content_type**  | string       | The content type (i.e. json) of the raw content of the request.                                    |

### Platform Resource

### Event resource

The event resource contains the structured data about the event triggered (Event Scripts) or from the API service call (Script APIs). As seen below, this includes things like the request and response information available to this “event”.

:::info
In order for a script to modify the event resource, the script must be configured to allow modification to events. This is done in the script editing screen by checking the **Allow script to modify request payload** checkbox.
:::


The platform resource provides access to the instance's REST API, configuration settings, and session information. It includes methods for making internal API calls using REST verbs like `get`, `post`, `put`, `patch`, and `delete`.

| **Property** | **Type**     | **Description**                                                         |
| ------------ | ------------ | ----------------------------------------------------------------------- |
| **api**      | resource     | An array/object that allows access to the instance’s REST API           |
| **config**   | resource     | An array/object consisting of the current configuration of the instance |
| **session**  | resource     | An array/object consisting of the current session information           |


#### Platform API

#### Event request


The **api** resource contains methods for instance API access. This object contains a method for each type of REST verb.

| **Function** | **Description**       |
| ------------ | --------------------- |
| **get**      | GET a resource        |
| **post**     | POST a resource       |
| **put**      | PUT a resource        |
| **patch**    | PATCH a resource      |
| **delete**   | DELETE a resource     |

They all accept the same arguments:

```
method( "service[/resource_path]"[, payload[, options]] );
```

## Helpful Links and Sample Scripts

Explore a variety of scripting examples and resources to help you get started with DreamFactory scripting:

- **[df-scriptingexamples Repository](https://github.com/dreamfactorysoftware/example-scripts)**: A collection of sample scripts demonstrating how to leverage DreamFactory's scripting capabilities.
- **[Event Scripting Documentation](./event-scripting.md)**: Learn how to create and manage event scripts in DreamFactory.
- **[Scripted Services Documentation](./scripted-services.md)**: Discover how to create standalone scripted services and endpoints.

## Best Practices

1. **Modularize your code**: Break down complex logic into smaller, reusable functions.
2. **Handle errors gracefully**: Implement error handling to manage exceptions and provide meaningful error messages.
3. **Optimize performance**: Minimize script execution time to ensure efficient API responses.
4. **Secure your scripts**: Validate inputs and sanitize outputs to prevent security vulnerabilities.

## Troubleshooting Tips

1. **Check script syntax**: Ensure your script has correct syntax for the chosen language.
2. **Enable error logging**: Use DreamFactory's logging features to capture script errors.
3. **Test incrementally**: Start with simple scripts and gradually add complexity.
4. **Use platform.api for debugging**: Make API calls within your script to test functionality.
5. **Monitor performance**: Be mindful of script execution time, especially for complex scripts.

By utilizing these resources and best practices, you can effectively extend DreamFactory's capabilities and create powerful, customized API solutions.
