---
sidebar_position: 1
---

# Scripting Resources

This page provides a comprehensive overview of the resources available for scripting in DreamFactory, including links to sample scripts and documentation references for event scripting and scripted services.

## Overview

DreamFactory's scripting capabilities allow you to extend the functionality of your APIs by executing custom scripts in response to events or as standalone services. These scripts can be written in various supported languages and can interact with the DreamFactory platform to perform complex operations.

## Supported Scripting Languages

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

The event resource includes properties such as `request`, `response`, and `resource`, which represent the inbound REST API call, the response, and any additional resource names, respectively.

| **Property** | **Type** | **Description**                                                                                                                              |
| ------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **request**  | resource | Represents the inbound REST API call, i.e. the HTTP request                                                                                  |
| **response** | resource | Represents the response to an inbound REST API call, i.e the HTTP response                                                                   |
| **resource** | string   | Any additional resource names typically represented as a replaceable part of the path, i.e. “table name” on a db/\_table/{table\_name} call. |

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

#### Event Response

The **response** resource contains the data being sent back to the client from the request.

| **Property**      | **Type**     | **Description**                                                                                    |
| ----------------- | ------------ | -------------------------------------------------------------------------------------------------- |
| **status_code**   | integer      | The HTTP status code of the response (i.e. 200, 404, 500, etc).                                    |
| **headers**       | resource     | An object/array of HTTP headers for the response back to the client.                               |
| **content**       | mixed        | The body of the request as an object if the content\_type is not set, or in raw string format.     |
| **content_type**  | string       | The content type (i.e. json) of the raw content of the request.                                    |

### Platform Resource

The platform resource provides access to the instance's REST API, configuration settings, and session information. It includes methods for making internal API calls using REST verbs like `get`, `post`, `put`, `patch`, and `delete`.

| **Property** | **Type**     | **Description**                                                         |
| ------------ | ------------ | ----------------------------------------------------------------------- |
| **api**      | resource     | An array/object that allows access to the instance’s REST API           |
| **config**   | resource     | An array/object consisting of the current configuration of the instance |
| **session**  | resource     | An array/object consisting of the current session information           |

#### Platform API

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
