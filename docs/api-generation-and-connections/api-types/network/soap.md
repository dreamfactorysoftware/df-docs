---
sidebar_position: 2
title: SOAP to REST
id: soap
description: "Turn an existing SOAP web service into a documented REST API. Point DreamFactory at a WSDL and every SOAP operation becomes a JSON endpoint with role-based access, API keys, and generated OpenAPI docs."
keywords: [SOAP to REST, WSDL, SOAP service, legacy API, SOAP wrapper, REST API for SOAP, WS-Security, WSSE, NTLM]
difficulty: "beginner"
---

# SOAP to REST

DreamFactory's SOAP connector reads a WSDL and exposes every operation it describes as a REST endpoint that accepts and returns JSON. Your callers never see XML envelopes, and the SOAP service sits behind the same API keys, roles, rate limits, and logging as every other DreamFactory API.

Nothing about the SOAP service changes. DreamFactory acts as a translating proxy in front of it.

:::info License
The SOAP connector requires a DreamFactory Silver or Gold license. On an open source install the type appears in the list but cannot be saved. See [Activating Your License](../../../getting-started/installing-dreamfactory/activating-your-license.md) if you have a key to apply.
:::

---

## How it works

1. You give DreamFactory the WSDL location.
2. DreamFactory parses the WSDL and caches the list of operations and their request and response types.
3. Each operation becomes `POST /api/v2/{service}/{operation}`. The JSON body is mapped to the SOAP request, and the SOAP response is returned as JSON.
4. An OpenAPI 3 document is generated from the WSDL types, so the API Docs tab and any OpenAPI client work immediately.

Everything in this guide was verified against DreamFactory 7.7 using the public calculator service at `http://www.dneonline.com/calculator.asmx?WSDL`, which exposes four operations: Add, Subtract, Multiply, and Divide. It is a good service to test with before pointing at your own.

---

## Create the service

In the admin panel go to **API Generation & Connections > API Types > Network** and click the **+** button. Choose **SOAP Service** as the type.

![Choosing the SOAP Service type](/img/api-generation-and-connections/api-types/network/network-create-service-type.png)

Fill in the basics:

| Field | Value |
|-------|-------|
| Namespace | The URL segment for the API, for example `calc`. Lowercase, no spaces. |
| Label | A display name, for example `Calculator SOAP`. |
| Description | Optional. |
| Active | Leave on. |

![SOAP service form](/img/api-generation-and-connections/api-types/network/soap-service-form.png)

Expand **Advanced Options** and set the **WSDL URI**. That is the only required field.

![SOAP advanced options with the WSDL URI](/img/api-generation-and-connections/api-types/network/soap-advanced-options.png)

Click **Save**. DreamFactory fetches the WSDL on the first request, so if the URL is wrong you will see the error when you call the API rather than on save.

:::tip Service Definition editor
The Advanced Options panel also shows a Service Definition editor. Leave it empty for SOAP services. DreamFactory generates the OpenAPI definition from the WSDL, so there is nothing to paste here.
:::

### Creating the service by API

The same service can be created with one call to the system API. This is handy for scripting environments or infrastructure-as-code.

```bash
curl -X POST "https://YOUR_DF_HOST/api/v2/system/service" \
  -H "X-DreamFactory-Session-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resource": [{
      "name": "calc",
      "label": "Calculator SOAP",
      "type": "soap",
      "is_active": true,
      "config": {
        "wsdl": "http://www.dneonline.com/calculator.asmx?WSDL"
      }
    }]
  }'
```

---

## Call the API

### List the operations

A GET on the service root returns every operation found in the WSDL.

```bash
curl "https://YOUR_DF_HOST/api/v2/calc" \
  -H "X-DreamFactory-API-Key: $API_KEY"
```

```json
{
  "resource": [
    { "name": "Add" },
    { "name": "Divide" },
    { "name": "Multiply" },
    { "name": "Subtract" }
  ]
}
```

Add `?refresh=true` to force DreamFactory to re-read the WSDL. Use it after the remote service adds or changes operations.

### Call an operation

POST to the operation name with the SOAP request fields as a JSON object. Field names come straight from the WSDL request type.

```bash
curl -X POST "https://YOUR_DF_HOST/api/v2/calc/add" \
  -H "X-DreamFactory-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"intA": 5, "intB": 7}'
```

```json
{ "AddResult": 12 }
```

Operation names are matched case-insensitively, so `add`, `Add`, and `ADD` all work. The generated API docs use the lowercase form with underscores removed.

GET also works for operations whose inputs fit in a query string:

```bash
curl "https://YOUR_DF_HOST/api/v2/calc/add?intA=5&intB=7" \
  -H "X-DreamFactory-API-Key: $API_KEY"
```

### Errors

An unknown operation returns HTTP 404. A SOAP fault from the remote service returns HTTP 500 with the fault text and code in the message, for example:

```json
{
  "error": {
    "code": 500,
    "message": "Server was unable to process request. ---> Arithmetic operation resulted in an overflow. [Fault code:soap:Server]"
  }
}
```

The full SOAP request and response are written to the DreamFactory log at debug level, which is the fastest way to see exactly what was sent when a call fails.

---

## Generated API documentation

Open **API Docs** and pick the service. Every operation is listed with a request schema and response schema derived from the WSDL types, and you can run calls from the browser.

![Generated API docs for the SOAP service](/img/api-generation-and-connections/api-types/network/soap-api-docs.png)

The underlying OpenAPI document is available at `GET /api/v2/api_docs/calc`, or from the **Download Api Documentation** button. Because it is real OpenAPI, you can feed it to code generators, API gateways, or an AI agent. For the calculator service the generated request schema for Add looks like this:

```json
{
  "type": "object",
  "properties": {
    "intA": { "type": "number", "format": "int32", "description": "signed 32-bit integer" },
    "intB": { "type": "number", "format": "int32", "description": "signed 32-bit integer" }
  }
}
```

---

## Secure the API

Create a role under **Role-Based Access**, grant it access to the SOAP service, and assign the role to an API key under **API Keys**. Callers then send the key in the `X-DreamFactory-API-Key` header.

For SOAP services, grant access at the service level by choosing `*` as the component. Per-operation scoping is not enforced for SOAP services in the current release, so a role that can reach one operation can reach all of them. If you need different callers to see different operations, wrap the SOAP service with an [API Builder](../../api-builder.md) endpoint or a [scripted service](../scripting/scripted-services-and-endpoints.md) per audience.

---

## Configuration reference

All of these live under **Advanced Options**.

### WSDL URI

An `http` or `https` URL to the WSDL, or a bare filename. A filename with no path is loaded from `storage/wsdl/` inside the DreamFactory install, which is the way to use a WSDL that is not reachable over HTTP, for example in an air-gapped environment. Copy the file there and enter just its name.

### Options

Name and value pairs passed to the underlying SOAP client. Any option from PHP's `SoapClient` is accepted. Values that name a PHP constant are resolved, so you can write the constant name rather than its number.

| Name | Example value | Purpose |
|------|---------------|---------|
| `soap_version` | `SOAP_1_2` | Use SOAP 1.2 instead of the default 1.1. |
| `login` / `password` | `svc_user` / `secret` | HTTP Basic authentication to the SOAP endpoint. |
| `ntlm_username` / `ntlm_password` | `DOMAIN\\user` / `secret` | NTLM authentication, common with Windows-hosted services. |
| `location` | `https://soap.example.com/service` | Override the endpoint address in the WSDL. |
| `cache_wsdl` | `WSDL_CACHE_NONE` | Disable the PHP-level WSDL cache while developing. |
| `connection_timeout` | `10` | Seconds to wait for the remote host. |
| `stream_context` | `{"http":{"header":"X-Trace: 1"}}` | A JSON object of PHP stream context options. |

Options that disable TLS certificate verification inside `stream_context` are rejected.

### Headers

SOAP headers sent with every request. Two types are available.

**Generic** builds a `SoapHeader` from the row: Namespace, Name, Data (a JSON object), MustUnderstand, and Actor. A Data value of `df:some_param` takes the value from the incoming request's `some_param` query parameter instead of a fixed string.

**WSSE** builds a WS-Security UsernameToken header with a nonce and digest. Add two rows of type WSSE: one with Name `username` and the username in Data, one with Name `password` and the password in Data. The optional **WSSE Username Token** field sets the `wsu:Id` attribute if the service requires one.

### Caching

**Data Retrieval Caching Enabled** and **Cache Time To Live** cache GET responses for the given number of seconds, which is useful for slow SOAP services that return reference data.

---

## Troubleshooting

**"Function '' does not exist on this service"** means the operation name in the URL did not match anything in the WSDL. Call the service root to see the exact names.

**Operations are missing after the remote WSDL changed.** DreamFactory caches the parsed WSDL. Call the service root with `?refresh=true`, or clear the cache under **System > Config**.

**A configuration change did not take effect.** Service configuration is cached. Use **Save & Clear Cache** on the service form, or clear the cache under **System > Config**.

**The WSDL cannot be fetched.** Confirm the URL opens from the DreamFactory server itself, not just from your workstation. If the server has no route to the WSDL host, download the file into `storage/wsdl/` and reference it by filename.

**The type saves but every call fails with a license error.** SOAP is a licensed connector. See [Activating Your License](../../../getting-started/installing-dreamfactory/activating-your-license.md).

---

## Related

- [HTTP Service](http-service.md) for wrapping REST and other HTTP APIs.
- [Role-Based Access](../../../Security/role-based-access.md) for locking the service down.
- [API Builder](../../api-builder.md) for composing SOAP operations with other services into one endpoint.
