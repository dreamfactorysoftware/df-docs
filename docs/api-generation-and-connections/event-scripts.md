---
sidebar_position: 3
sidebar_label: "Event Scripts"
title: "API Event Scripts: Validate, Transform & Govern | DreamFactory"
id: event-scripts
description: Execute custom scripts on API events to validate requests, transform responses, enforce governance rules, and add business logic.
keywords: [event scripts, event scripting, dreamfactory events, pre-process, post-process, PHP scripting, Python scripting, Node.js scripting, API customization, business logic, request validation, API governance, script event]
difficulty: "intermediate"
---

# Event Scripts

## What Are DreamFactory Event Scripts?

An **event** in DreamFactory is any API request that hits a DreamFactory endpoint — a GET to a database table, a POST to a file storage service, a DELETE on a custom resource. Every one of these interactions generates a named event that you can attach a script to.

An **event script** is custom code that DreamFactory executes at a defined point in the API request lifecycle. There are two interception points: **pre-process** scripts run after authentication but *before* the request reaches the data source, giving you the ability to inspect, modify, or block the request. **Post-process** scripts run after the data source responds but *before* DreamFactory returns the result to the caller, letting you transform, enrich, or filter the response.

```
HTTP Request
    │
    ▼
[Authentication & RBAC check]
    │
    ▼
[Pre-Process Script]  ← inspect/modify/block the request here
    │
    ▼
[DreamFactory Core → Data Source]
    │
    ▼
[Post-Process Script] ← transform/filter/enrich the response here
    │
    ▼
HTTP Response to caller
```

This architecture means you can enforce business rules, call external services, validate input, and shape output — all without touching your data source or the DreamFactory platform itself. Scripts are version-controlled in the DreamFactory database and applied instantly without restarting any services.

## Supported Scripting Languages

DreamFactory event scripts support the following languages:

| Language | Notes |
|---|---|
| **PHP** | Available in both Community and Enterprise editions. Full access to the `$event` and `$platform` objects. |
| **Python 3** | Available in Enterprise edition. Requires Python 3 and the `munch` package installed on the DreamFactory server (`pip3 install munch`, adding `--break-system-packages` on Debian 12 and later). Accesses event data via the `event` and `platform` dictionaries. |
| **Node.js** | Available in Enterprise edition. Requires Node.js installed on the server. Uses `event` and `platform` as JavaScript objects. |

Community Edition users can use PHP for all event scripting. Enterprise Edition unlocks Python and Node.js for teams that prefer those languages or need ecosystem-specific libraries (e.g., NumPy for data transformation, npm packages for webhook integration).

See [Scripting Resources](/api-generation-and-connections/api-types/scripting/scripting-resources) for sample scripts and language reference documentation for each supported engine.

## Common Event Script Use Cases

### Validating Request Parameters

Reject requests that are missing required fields before they reach the database. This prevents null-value inserts and surfaces clear error messages to API consumers.

```php
<?php
// Pre-process script on POST to _table/orders
$payload = $event['request']['payload']['resource'] ?? [];

foreach ($payload as $record) {
    if (empty($record['customer_id']) || empty($record['product_id'])) {
        $event['response']['status_code'] = 400;
        $event['response']['content'] = [
            'error' => 'Both customer_id and product_id are required fields.'
        ];
        return; // halt further processing
    }
}
?>
```

### Transforming API Responses

Remap field names in responses to match a public API contract without changing your database schema.

```python
# Post-process script on GET to _table/employees (Python)
import json

records = event['response']['content'].get('resource', [])
for record in records:
    # Rename internal field names to public API names
    if 'emp_fname' in record:
        record['first_name'] = record.pop('emp_fname')
    if 'emp_lname' in record:
        record['last_name'] = record.pop('emp_lname')
    if 'dept_code' in record:
        record['department'] = record.pop('dept_code')

event['response']['content']['resource'] = records
```

### Enforcing Row-Level Security

Automatically inject a WHERE clause filter on all GET requests for a service so that users only ever retrieve records belonging to their own account — regardless of what filter parameters they pass. For declarative access control without scripting, see [Role-Based Access Control](/Security/role-based-access).

```php
<?php
// Pre-process script on GET to _table/{table_name}
// Inject a filter so users can only see their own records
$sessionUserId = $platform['session']['user']['id'] ?? null;

if ($sessionUserId) {
    $existingFilter = $event['request']['parameters']['filter'] ?? '';
    $ownershipFilter = "owner_user_id = $sessionUserId";

    $event['request']['parameters']['filter'] = $existingFilter
        ? "($existingFilter) AND ($ownershipFilter)"
        : $ownershipFilter;
}
?>
```

### Calling an External Webhook

Notify a Slack channel (or any webhook) whenever a new record is created via POST, without blocking the API response.

```javascript
// Post-process script on POST to _table/leads (Node.js, queued event type)
const https = require('https');

const payload = JSON.stringify({
    text: `New lead created: ${event.request.payload.resource[0].email}`
});

const options = {
    hostname: 'hooks.slack.com',
    path: '/services/YOUR/SLACK/WEBHOOK',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
};

const req = https.request(options);
req.write(payload);
req.end();
```

Use the **queued** event type for webhook notifications — the API call returns immediately to the caller and the script runs asynchronously, avoiding added latency.

### Blocking Requests Based on Business Logic

Block DELETE requests outside of business hours to prevent accidental data loss during off-hours operations.

```php
<?php
// Pre-process script on DELETE to any _table resource
$hour = (int) date('G'); // 0-23 UTC
$isBusinessHours = ($hour >= 9 && $hour < 17); // 9 AM – 5 PM UTC

if (!$isBusinessHours) {
    $event['response']['status_code'] = 403;
    $event['response']['content'] = [
        'error' => 'DELETE operations are restricted to business hours (09:00–17:00 UTC).'
    ];
}
?>
```

## Attaching Scripts to API Events

1. **Navigate** to **API Generation & Connections > Event Scripts** in the DreamFactory admin panel.
2. Click the **+** button to create a new script.
3. **Select the service** from the service dropdown — this is the API the script will be attached to (e.g., your MySQL database service named `mydb`).
4. **Select the event type**: `pre_process`, `post_process`, or `queued`.
5. **Select the HTTP method** (GET, POST, PUT, PATCH, DELETE) and, if applicable, a specific table name from the Table Name dropdown.
6. **Choose the script language** from the Script Type dropdown (PHP, Python, Node.js).
7. Check **Allow Event Modification** if your script modifies the request payload or response content. Scripts that only read data and block requests (via status code) do not require this.
8. Check **Active** to enable the script immediately.
9. **Write or paste your script** in the editor.
10. Click **Save**. The script takes effect on the next matching API request — no restart required.

Test by making a matching API call through the API Docs tab or with curl/Postman and observing the modified behavior.

Event Scripting is a powerful feature in DreamFactory that allows you to execute custom scripts when specific system events occur. These scripts can modify requests and responses, perform additional actions, or interrupt the API call flow based on custom logic. These scripts are added to existing API services and can be used to extend the functionality of the API.

## Event Format

API-generated events typically follow this format:

service[.resource].verb[.type]

Where:
- **service**: The name of the service/API
- **resource**: Optional resource path (replacing '/' with '.')
- **verb**: The HTTP verb used in the request (GET, POST, PUT, etc.)
- **type**: The type of event (pre_process, post_process, etc.)

Example: `db._table.{table_name}.get.pre_process`

This would be a script that is executed before a GET request to the `db._table.{table_name}` API, which would be all tables within the API. 

Example: `db._table.customer.get.pre_process`

This would be a script that is executed before a GET request to the `db._table.customer` API, which is the API for only the `customer` table.

## Scriptable Event Types

DreamFactory supports three main types of event scripts:

1. **Pre-Process**: Executed after authentication but before the API call is processed.
2. **Post-Process**: Executed after the API call is processed but before the response is sent to the client.
3. **Queued**: Executed asynchronously after the API call is completed.

## Configuring Event Scripts

To create or update an event script, follow these steps:

1. Within the DreamFactory UI, navigate to "API Generation & Connections" > "Event Scripts"
2. Click the plus (+) button to create a new script
3. Select the service from the service dropdown
4. Select the event type and method from the dropdowns
5. If applicable, choose the table name for the script in the Table Name dropdown. 
6. Optionally, change the script name
7. Choose the script language from the Script Type dropdown.
8. Mark the script as active, and if the script should modify the event (such as changing the payload or response), check the Allow Event Modification checkbox.
9. Add your script content, and save when complete. 

## Storing Scripts in Files or Source Control

Rather than pasting a body into the editor, an event script can be linked to a file held in a file storage service, or to a file in a repository exposed through a source control service. DreamFactory reads the body from that location when the script is loaded, which lets you edit scripts in your own tooling and keep them under version control.

In the script editor, tick **Add path to file** to reveal the linking fields:

| Field | Purpose |
|---|---|
| **Service** | The file storage service holding the script. |
| **Path** | Path to the script file within that service. |

To link to a repository instead, use the **Github Import** button. The dialog that opens adds:

| Field | Purpose |
|---|---|
| **Select Service** | The source control service to read from. |
| **Repository** | The repository containing the script file. |
| **Branch/Tag** | The branch or tag to read from. Leave empty to use the repository's default branch. |
| **Path** | Path to the script file within the repository. |

If you are configuring scripts through the API rather than the UI, these correspond to the `storage_service_id`, `storage_path`, `scm_repository`, and `scm_reference` fields on the script.

### Linking is one-way

DreamFactory reads from the linked location but never writes back to it. Editing the body in the admin editor while a script is linked does not commit anything to the repository or file service, so the linked file remains the source of truth. Make your changes where the file lives rather than in the editor.

### Refreshing after a change

Once loaded, a linked script's content is cached indefinitely, so edits to the underlying file do not take effect until that cache is cleared.

From the admin console, go to **System Settings > Config > Cache** and use **Flush System-Wide Cache**. Note that the **Per-Service Caches** buttons on the same page will not do it — those flush a service's own cache, not stored script content.

To clear a single event script instead of everything, call:

```
DELETE /api/v2/system/cache/_event/{event_name}
```

See the [System API reference](/api-reference/system-api) for the other cache endpoints.

For scripts kept in GitHub, the linking dialog offers **Auto-refresh on GitHub push**, which produces a **Payload URL** to paste into your repository's Settings → Webhooks. Each push then clears the cached copy so the next call picks up the latest version.

### Access requirements

The fetch of the linked file runs under the permissions of the request that triggered the event, not as an administrator. The role that caller uses therefore needs GET access to the storage or source control service holding the script.

Without that access the fetch fails, the failure is recorded in the log, and the script does not run — while the API request itself continues normally. A script that appears correctly configured but never seems to take effect is worth checking against this first.

## Scripting Examples

Explore a variety of scripting examples in the [df-scriptingexamples](https://github.com/dreamfactorysoftware/example-scripts) repository. This repository contains numerous scripts demonstrating how to leverage DreamFactory's scripting capabilities to enhance your APIs.

### Highlighted Scripts

- **Pre-Process Validation Script**: Validates incoming request payloads to ensure required fields are present and modifies the payload as needed.
  
  ```php
  <?php
  // Check if the required field 'name' is present
  if (!isset($event['request']['payload']['name'])) {
      $event['response']['status_code'] = 400;
      $event['response']['content'] = ['error' => 'Name field is required'];
  }
  // Modify the payload
  $event['request']['payload']['timestamp'] = date('Y-m-d H:i:s');
  ?>
  ```

- **Post-Process Data Enrichment Script**: Enhances the response by adding additional data from related services.

  ```php
  <?php
  // Add a custom field to the response
  $event['response']['content']['custom_field'] = 'Added by post-process script';

  // Call another service to get related data
  $relatedData = $platform->api->get('related_service/data');
  $event['response']['content']['related_data'] = $relatedData;
  ?>
  ```

These examples illustrate how you can use event scripts to implement custom business logic, validate data, and enrich API responses. For more examples and detailed scripts, visit the [df-scriptingexamples](https://github.com/dreamfactorysoftware/df-scriptingexamples) repository.

## Programmatic Resources Available to a Script

When an event script is executed, DreamFactory provides two primary resources:

- **Event Resource**: Contains data about the event triggering the script.
- **Platform Resource**: Allows access to configuration, system states, and internal API calls.

### Event Resource

The event resource includes properties such as `request`, `response`, and `resource`, which represent the inbound REST API call, the response, and any additional resource names, respectively.

| **Property** | **Type** | **Description**                                                                                                                    |
| ------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **request**  | resource | Represents the inbound REST API call, i.e. the HTTP request                                                                        |
| **response** | resource | Represents the response to an inbound REST API call, i.e the HTTP response                                                         |
| **resource** | string   | Any additional resource names typically represented as a replaceable part of the path, i.e. `table name` on a `db/_table/{table_name}` call |

### Platform Resource

The platform resource provides access to the instance's REST API, configuration settings, and session information. It includes methods for making internal API calls using REST verbs like `get`, `post`, `put`, `patch`, and `delete`.

| **Property** | **Type** | **Description**                                                         |
| ------------ | -------- | ----------------------------------------------------------------------- |
| **api**      | resource | An array/object that allows access to the instance’s REST API           |
| **config**   | resource | An array/object consisting of the current configuration of the instance |
| **session**  | resource | An array/object consisting of the current session information           |

## Troubleshooting Event Scripts

### Script not firing

**Symptom**: You saved a script but API calls to that endpoint are not triggering it.

**Cause**: The event path in the script configuration does not exactly match the event generated by the API call.

**Fix**: Check the event name format — it follows `service.resource.verb.type` (e.g., `mydb._table.customers.get.pre_process`). Navigate to **Logs** in the DreamFactory admin panel and look for event names being generated by test API calls. Copy the exact event name and ensure your script is registered against it. Even a minor difference like using `customer` vs `customers` in the table name will cause the script to be skipped.

Also confirm the script's **Active** checkbox is enabled — inactive scripts are saved but never executed.

### Syntax errors causing the script to silently fail

**Symptom**: No changes to request/response behavior, and no obvious error returned.

**Cause**: A syntax error in the script causes it to fail silently if error reporting is suppressed.

**Fix**: Enable script debugging by setting `APP_DEBUG=true` in your DreamFactory `.env` file (temporarily, for development only). With debug enabled, script syntax errors will appear in the API response body. Once resolved, set `APP_DEBUG=false` for production.

For PHP scripts, you can also test syntax independently before saving:
```bash
php -l your_script.php
```

### Script timeout issues

**Symptom**: Pre-process or post-process scripts that call external services cause API requests to time out.

**Cause**: Scripts run synchronously as part of the API request, so they are bound by the platform's normal request limits rather than a DreamFactory-specific setting. The relevant limits are PHP's `max_execution_time`, PHP-FPM's `request_terminate_timeout`, and your web server's proxy read timeout (`fastcgi_read_timeout` in nginx). Calls to webhooks or third-party APIs can exceed these.

**Fix**: For long-running operations, switch the script to the **queued** event type — queued scripts run asynchronously and do not block the API response. For pre-process scripts that must complete before the response (e.g., validation), optimize the external call, or raise the limits above in your PHP and web server configuration.

Note that Python and Node.js scripts authenticate their internal API calls with a script token that is valid for 300 seconds. A script still making `platform.api` calls more than five minutes after it began will find that token expired.

### Accessing platform resources from within scripts

Scripts have access to the `$platform` (PHP) or `platform` (Python/Node.js) object for making internal DreamFactory API calls. To create a fully custom scripted API service (rather than attaching logic to an existing endpoint), see [Scripted Services and Endpoints](/api-generation-and-connections/api-types/scripting/scripted-services-and-endpoints).

```php
<?php
// Call another DreamFactory service from within a script
$result = $platform['api']->get('my_other_service/_table/lookup_table');
$lookupData = $result['content']['resource'] ?? [];
?>
```

How that call is carried out depends on the language. PHP scripts call the API in process, inheriting the session context without a separate authentication pass. Python and Node.js scripts make a real HTTP request back to the instance and re-authenticate using a short-lived script token, so those calls run under the role of the user whose request triggered the script.

Be careful about using internal API calls in pre-process scripts — they add latency to every matching request.

#### Relative and absolute URLs

A path with no scheme, such as `my_other_service/_table/lookup_table`, is treated as an internal call and is authenticated for you.

A path beginning with `http://` or `https://` is treated as an external call, even when it points back at the same instance — `http://localhost/api/v2/...` included. External calls do not receive credentials automatically, so you must supply them yourself:

```python
options = {}
options['headers'] = {}
options['headers']['X-DreamFactory-Api-Key'] = platform.session.api_key
options['headers']['X-DreamFactory-Session-Token'] = platform.session.session_token

result = platform.api.get('http://localhost/api/v2/db/_table/todo', options)
```

This distinction matters when DreamFactory runs behind a proxy or gateway that rewrites the `Host` header. Internal calls from Python and Node.js scripts resolve against the host of the incoming request, so on those deployments a relative path can route back out through the proxy instead of staying on the machine. An absolute `localhost` URL with explicit headers keeps the call local.

### General troubleshooting tips

1. **Check script syntax**: Ensure your script has correct syntax for the chosen language.
2. **Enable error logging**: Use DreamFactory's logging features to capture script errors.
3. **Test incrementally**: Start with simple scripts and gradually add complexity.
4. **Use platform.api for debugging**: Make API calls within your script to test functionality.
5. **Monitor performance**: Be mindful of script execution time, especially for pre- and post-process scripts.

By mastering event scripts, you can extend DreamFactory's functionality and create powerful, customized API behaviors tailored to your specific needs.

## Related Documentation

- [Scripting Resources](/api-generation-and-connections/api-types/scripting/scripting-resources) — Sample scripts, event/platform object reference, and language-specific documentation for PHP, Python, and Node.js.
- [Scripted Services and Endpoints](/api-generation-and-connections/api-types/scripting/scripted-services-and-endpoints) — Create fully custom standalone API services using scripting, rather than attaching scripts to existing endpoints.
- [Role-Based Access Control](/Security/role-based-access) — Configure declarative access control per service, endpoint, and HTTP method without writing scripts.
