---
sidebar_position: 1
---

# Scripting Resources

DreamFactory offers an extraordinarily powerful solution for creating APIs and adding business logic to existing APIs using a variety of popular scripting languages including PHP, Python, Node.js, and JavaScript. In this section we'll walk you through several examples which will hopefully spur the imagination regarding the many ways in which you can take advantage of this great feature.

## Supported Scripting Languages
DreamFactory has several scripting languages available for customized scripting of endpoints and services. To get a list of the currently supported and configured scripts on a particular instance, use the API endpoint:

```
http:/example.com/api/v2/system/script_type
```

A sample output from this endpoint is below:
```
    {
        "resource": [
            {
                "name": "nodejs",
                "label": "Node.js",
                "description": "Server-side JavaScript handler using the Node.js engine.",
                "sandboxed": false,
                "supports_inline_execution": false
            },
            {
                "name": "php",
                "label": "PHP",
                "description": "Script handler using native PHP.",
                "sandboxed": false,
                "supports_inline_execution": false
            },
            {
                "name": "python",
                "label": "Python",
                "description": "Script handler using native Python.",
                "sandboxed": false,
                "supports_inline_execution": false
            },
            {
                "name": "python3",
                "label": "Python3",
                "description": "Script handler using native Python3.",
                "sandboxed": false,
                "supports_inline_execution": false
            }
        ]
    }
```

:::info

The sandbox parameter means that the script execution is bound by memory and time and is not allowed access to other operating system functionalities outside of PHP's context. Therefore, be aware that DreamFactory cannot control what is done inside scripts using non-sandboxed languages on a server.

:::

The following languages are typically supported on most DreamFactory installations:

* Node.js
* PHP
* Python

## Where to use DreamFactory Scripting

Scripts can be used within two places in DreamFactory, ***Event Scripts*** and ***Scripted APIs***. ***Event Scripts*** is tied to and triggered by API calls, internal events or other scrips. The other way is through customize-able script APIs. There is a scripting API type for each supporting scripting language (above).

## Programatic Resources Available to a Script

When a script is executed, DreamFactory passes the script(s) two primary resources to allow the script to access many parts of the system including the state, configuration and even the ability call other internal APIs or external APIs. They are the **event** and **platform** resources and are described below.

:::info
The "resource" term is used generically in this context. Depending on the scripting language being used, the resource could be an object (Node.js, Python) or an array (PHP)
:::

### The Event Resource

The event resource contains the structured data about the event triggered (Event Scripts) or from the API service call (Scripte APIs). As seen below, this includes things like the request and response information available to this “event”.

:::info
In order for a script to be able to modify the event resource, the script must be configured to allow modification to events. This is done by checking the "Allow script to modify request payload" checkbox in the script editing screen. 
:::

The following are the properties of the event resource. Below are similar tables for the properties of each property. 

| Property            | Type             | Description     |
| --------------------|------------------|------------------
| request        | resource     | Represents the inbound REST API call, i.e. the HTTP request
| response        | resource          | Represents the response to an inbound REST API call, i.e the HTTP response
| resource    | string            | Any additional resource names typically represented as a replaceable part of the path, i.e. “table name” on a `db/_table/{table_name}` call.

#### Event Request

The **request** resource contains all the components of the original HTTP request. This resource is always available, and is writable during pre-process event scripting.

| Property            | Type             | Description     |
| --------------------|------------------|------------------
| api_version        | string     | The API version used for the request (i.e. 2.0).
| method        | string          | The HTTP method of the request (i.e. GET, POST, PUT).
| parameters    | resource            | An object/array of query string parameters received with the request, indexed by the parameter name.
| headers        | resource     | An object/array of HTTP headers from the request, indexed by the lowercase header name. Including content-length, content-type, user-agent, authorization, and host.
| content        | string          | The body of the request in raw string format.
| content_type    | string            | The format type (i.e. "application/json") of the raw content of the request.
| payload        | resource     | The body (POST body) of the request, i.e. the content, converted to an internally usable object/array if possible.
| uri        | string          | Resource path, i.e. /api/v2/php.
| service    | string            | The type of service, i.e. php, nodejs, python.