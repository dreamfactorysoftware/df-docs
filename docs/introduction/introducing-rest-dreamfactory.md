---
sidebar_position: 1
title: Introducing REST and DreamFactory
id: introducing-rest-and-dreamfactory
---

# Introducing REST and DreamFactory

No matter your role in today's IT industry, APIs are an inescapable part of the job. Marketers regularly integrate Salesforce, Pipedrive, and MailChimp APIs into campaigns, software developers rely upon Stripe, Google Maps, and Twitter APIs to build compelling web applications, and Data scientists grapple with an increasingly unwieldy avalanche of company metrics using Amazon Machine Learning, Elasticsearch, and IBM EventStore APIs. Meanwhile, the executive team relies upon Geckoboard, Google Analytics, and Baremetrics to monitor company progress and future direction.

In addition to integrating third-party APIs, your organization is likely deeply involved in the creation of internal APIs used to interact with proprietary data sources. But unlike the plug-and-play APIs mentioned above, manual API development is anything but a walk in the park. This process is incredibly time-consuming, error-prone, and ultimately a distraction from the far more important task of building compelling products and services.

This chapter introduces you to DreamFactory, an automated REST API generation, integration, and management platform. You can use DreamFactory to generate REST APIs for hundreds of data sources, including MySQL and Microsoft SQL Server databases, file systems including Amazon S3, and e-mail delivery providers like Mandrill. You can also integrate third-party APIs, including all of the services mentioned above. This opens up a whole new world of possibilities in terms of building sophisticated workflows. But before we jump into this introduction, some readers might be wondering what a REST API is in the first place, let alone why so many organizations rely on REST for their API implementations.

## Introducing REST

If you were to design an ideal solution for passing data between computers ("computers" here refers to any servers, laptops, mobile phones, or other Internet-connected device), what would it look like?

For starters, we might consider HTTP for the transport protocol since applications can quickly be created that communicate over HTTP and HTTPS. Further, HTTP supports *request URLs*, which can be constructed to easily identify a particular target resource (e.g. `https://www.example.com/employees/42` ), *request methods*, which identify what we'd like to do in conjunction with the target resource (e.g. GET (retrieve), POST (insert), PUT (update), DELETE (destroy)), and *request payloads* in the form of URL parameters and message bodies.

We'd also want to incorporate an understandable and parseable messaging format such as XML or JSON; not only can programming languages easily construct and navigate these formats, but they're also relatively easy on the eyes for us humans.

Finally, we would want the solution to be extensible, allowing for integration of capabilities such as caching, authentication, and load balancing. In doing so, we can create secure and scalable applications.

If such a solution sounds appealing, then you're going to love working with REST APIs. Representational State Transfer (REST) is a term used to define a system that embodies several characteristics. You can visit the [Wikipedia REST topic](https://en.wikipedia.org/wiki/Representational_state_transfer) for more details, but here are the basics:

* **Client-server architecture**: By embracing the client-server model, REST API-based solutions can incorporate multiple application and database servers to create a distributed, secure, and maintainable environment.

* **Uniform interface**: REST's use of HTTP URLs, HTTP methods, and media type declarations contribute to an environment that is easily understandable by both the implementers and end users.

* **Statelessness**: All REST-based communication is stateless, meaning each client request includes everything the server requires to respond to the request. The target URL, requeset method, content type, and API key are just a few examples of what might be included in the request.

* **Layered system**: Support for system layering is what enables middleware to be easily introduced, allowing for user authentication and authorization, data caching, load balancing, and proxies to be used without interfering with the implementation.

* **Cache control**: The HTTP response can include information indicating whether the response data is cacheable, ensuring intermediary environments don't erroneously serve stale data while also allowing for scaleability.

Now that you understand a bit more about REST architecture, let's review a number of typical REST requests and responses.

:::info
In DreamFactory's documentation you'll often encounter the term *resource*. In the REST context, a resource is any piece of data that can be named. For instance, an image, employee, classroom, or vehicle would all be referred to as a resource. A resource can be a single instance of this named data, or it can be a collection. In other words, an employee would be a singleton resource, whereas a set of employees would be a collection resource.
:::

## Dissecting REST Requests and Responses

REST API integrators spend a great deal of time understanding how to generate proper REST requests, and how to parse REST responses. As we've discussed, these requests and responses revolve around HTTP URLs, HTTP methods, request payloads, and response formats. In this section you'll learn more about the role of each. If you're not familiar with these REST concepts, spending a few minutes learning about them dramatically reduces the amount of time and effort need to get acquainted with DreamFactory.

## Retrieving Resources

A proper REST API URL pattern implementation is centered around the *resource* (the noun), and leaves any indication of the desired action (the verb) to the accompanying HTTP method. Consider the following request:

    GET /api/v2/employees

If the endpoint exists and records are found, the REST API server responds with a `200` status code and JSON-formatted results. Here's an example response returned by DreamFactory:
```
    {
      "resource": [
        {
          "id": 1,
          "first_name": "Georgi",
          "last_name": "Facello"
        },
        {
          "id": 2,
          "first_name": "Bezalel",
          "last_name": "Simmel"
        }
        ...
      ]
    }
```

This clarity is representative of a typical REST request; based on the method and URL, it is clear the client is requesting a list of employees. We know the client wants to retrieve records because the request is submitted using the `GET` method. Contrast this with the following request:

    `GET /api/v2/employees/find`

This is not RESTful because the implementer has incorporated an action into the URL. Returning to the original pattern, consider how a specific employee might be requested:

    `GET /api/v2/employees/42`

The addition of an ID (often but not always a resource's primary key) indicates the client is interested in retrieving the employee record associated with a unique identifier which has been assigned the value `42`. The JSON response might look like this:
```
    {
      "id": 42,
      "first_name": "Claudi",
      "last_name": "Kolinko"
    }
```

Many REST API implementations, DreamFactory included, support the passage of query parameters to modify query behavior. For instance, if you want to retrieve just the `first_name` field when retrieving a resource, DreamFactory supports a `fields` parameter for doing so:

    `GET /api/v2/employees/42?fields=first_name`

The response would look something like this:
```
    {
      "first_name": "Claudi"
    }
```

`GET` requests are *idempotent*, meaning no matter how many times you submit the request, the same results can be expected, with no unintended side effects. Contrast this with `POST` requests (introduced next), which are non-idempotent because if you submitted the same resource creation request more than once, it is possible for duplicate resources to be created.

## Creating Resources

If you want to insert a new record into the `employees` table, then the `POST` method is used:

    `POST /api/v2/employees`

Of course, the request must be accompanied by the data to be created. This is passed along by the request body and might look like this:
```
    {
      "resource": [
        {
          "first_name": "Johnny",
          "last_name": "Football"
        }
      ]
    }
```

## Updating Resources

HTTP supports two different methods for updating data:

* **PUT**: The `PUT` method replaces an existing resource in its entirety. This means you need to pass along *all* of the resource attributes regardless of whether the attribute value is actually being modified.
* **PATCH**: The `PATCH` method updates only part of the existing resource, meaning you only need to supply the resource primary key and the attributes you want to update. This is typically a more convenient update approach than `PUT`, although both have their uses.

When updating resources with `PUT` you send a `PUT` request like this:

    `PUT /api/v2/employees`

You must send *all* of the resource attributes within the request payload:
```
    {
      "resource": [
        {
          "id": 42,
          "first_name": "Johnny",
          "last_name": "Baseball"
        }
      ]
    }
```

To only update one or more (but not all) attributes associated with a particular record found in the `employees` resource, you can send a `PATCH` request to the `employees` URL, accompanied by the primary key:

    `/api/v2/employees/42`

If the `employees` table includes attributes such as `first_name`, `last_name`, and `employee_id`, but we only want to modify the `first_name` value. The JSON request body would look like this:
```
    {
      "resource": [
        {
          "first_name": "Paul"
        }
      ]
    }
```

## Deleting Resources

To delete a resource, you can send a `DELETE` request to the endpoint associated with the resource you'd like to delete. For instance, to delete an `employees` resource, reference this URL:

    `DELETE /api/v2/employees/42`

## Introducing DreamFactory

With all that we've covered in this topic, the thought of implementing a REST API on your own probably sounds quite daunting. It should, because it is. Not only would you be responsible for building out the logic required to process the request methods and URLs, but you'd also be on the hook for integrating authentication and authorization, generating and maintaining documentation, and figuring out how to sanely generate working APIs for any number of third-party data sources. It's a handful!

And this is only the beginning of your challenges. As your needs grow, so does the complexity. Consider the amount of work required to add per-endpoint business logic capabilities to your API. Or bolting on API limiting features. Or adding per-service API logging. The work required to build and maintain these features can be staggering, and can easily distract you and your team from the more important goal of satisfying customers through the creation of superior products and services.

Fortunately, DreamFactory is here to help. We provide an API automation solution that handles *all* of these challenges for you, and is managed almost entirely through an easy point-and-click web interface. To conclude this chapter we've included details on DreamFactory's key features, giving you all of the information needed to determine if DreamFactory is a worthy addition to your organization's development toolkit.

## Automated REST API Generation

Although DreamFactory is packed with dozens of features, everything revolves around the platform's automated REST API generation capabilities. This feature alone can have such a tremendous impact that it will save your team weeks if not months of development time on future API projects!

DreamFactory natively supports automated API generation capabilities for several dozen databases (including Oracle, MySQL, MS SQL Server, and MongoDB), file systems, e-mail delivery providers, mobile notification solutions, and even source control services. Additionally, it can convert SOAP services into REST with no refactoring required to the SOAP code, create REST APIs for caching solutions such as Memcached and Redis, and even supports the ability to script entirely new services from scratch using one of four supported scripting engines (NodeJS, PHP, Python, and V8).

The structure and number of REST endpoints exposed through each generated API varies according to the type of data source, however you can count on them being "feature complete" from a usability standpoint. For instance, REST APIs generated for one of the supported databases include endpoints for executing stored procedures, carrying out CRUD (Create, Retrieve, Update, Delete) operations, and even managing the database!

## Secured APIs from the Start

All DreamFactory REST APIs are secured *by default*, leaving no chance whatsoever for your valuable data to be exposed or even modified by a malicious third-party who happened across the API. At a minimum all clients are required to provide an API key which the DreamFactory platform administrator generates from the administration console.

It's also possible to lock down API key capabilities using DreamFactory's *roles* feature. Using role management, you can restrict an API key's ability to interact with an API, allowing access to only a few select endpoints, or limiting access to exclusively `GET` methods (meaning you can create a read-only API).

DreamFactory's security features go well beyond API key-based authentication. You can require users to login using a variety of solutions, including basic authentication, LDAP, Active Directory, and single sign-on (SSO). Once successfully signed in, users are assigned a session token which is used to verify authentication status for all subsequent requests.

## Interactive OpenAPI Documentation

Your developers will want to begin integrating the API into new and existing applications, and therefore need a thorough understanding of the endpoints, input parameters, and responses. DreamFactory automates the creation of this documentation for you by generating it at the same time the API is automated. The following screenshot presents an example set of documentation generated by DreamFactory in association with a MySQL REST API:

![Example API Documentation Produced by DreamFactory](/img/overview/openapi-docs-example.png)

The documentation goes well beyond presenting a list of endpoints. As you'll learn in later chapters, you can click on any of these endpoints and interact with the API! Additionally, your DreamFactory administrator can create user accounts which grant access exclusively to the documentation, while preventing these accounts from carrying out other administrative tasks.

## Business Logic Integration

It's often the case that you'll want to tweak the behavior of your APIs, for instance validating incoming input parameters, calling other APIs as part of the request/response workflow, or transforming a response structure prior to returning it to the client. DreamFactory's scripting feature allows you to incorporate logic into any endpoint, running it on the request or response side of the communication (or both!). You can use any of the four supported scripting engines, including NodeJS, PHP, Python, or V8. Using these scripting engines in conjunction with a variety of DreamFactory data structures made available to these endpoints, the sky really is the limit in terms of your ability to tweak your API behavior.

## API Limiting

Your organization has spent months if not years aggregating and curating a valuable trove of data, and lately your customers and other organizations have been clamoring for the ability to access it. This is typically done by *monetizing* the API, assigning customers volume-based access in accordance with a particular pricing plan.

DreamFactory's API limiting features allow you to associate volume-based limits with a particular user, API key, REST API, or even a particular request method. Once enabled, DreamFactory monitors the configuration in real-time, returning an HTTP 429 status code (Too Many Requests) to the client once the limit is reached. While a convenient web interface is provided for managing your API limits, it's also possible to programmatically manage these API limits, meaning you can integrate limit management into your SaaS application!

## API Logging and Reporting

Whether your organization is required to follow the European Union's General Data Protection Regulation (GDPR), or you'd just like to keep close tabs on the request volume and behavior of your REST APIs, you'll want to integrate a robust and detailed API logging and reporting solution. Fortunately, DreamFactory plugs into [Logstash](https://www.elastic.co/products/logstash), which is part of the formidable ELK (Elasticsearch, Logstash, Kibana) stack. This amazing integration allows you to create dashboards and reports which can provide real-time monitoring of API key activity, HTTP status codes, and hundreds of other metrics.

## Conclusion

There you have it; a thorough overview of REST APIs and the DreamFactory platform. If this approach to REST API generation and management sounds too appealing to pass up, forge ahead to chapter 2 where you'll learn how to download, install, and configure your DreamFactory platform!



