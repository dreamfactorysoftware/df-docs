---
sidebar_position: 2
---

# Event Scripts

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

| **Property** | **Type** | **Description**                                                                                                                              |
| ------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **request**  | resource | Represents the inbound REST API call, i.e. the HTTP request                                                                                  |
| **response** | resource | Represents the response to an inbound REST API call, i.e the HTTP response                                                                   |
| **resource** | string   | Any additional resource names typically represented as a replaceable part of the path, i.e. “table name” on a db/\_table/{table\_name} call. |

### Platform Resource

The platform resource provides access to the instance's REST API, configuration settings, and session information. It includes methods for making internal API calls using REST verbs like `get`, `post`, `put`, `patch`, and `delete`.

| **Property** | **Type** | **Description**                                                         |
| ------------ | -------- | ----------------------------------------------------------------------- |
| **api**      | resource | An array/object that allows access to the instance’s REST API           |
| **config**   | resource | An array/object consisting of the current configuration of the instance |
| **session**  | resource | An array/object consisting of the current session information           |

## Troubleshooting Tips

1. **Check script syntax**: Ensure your script has correct syntax for the chosen language.
2. **Enable error logging**: Use DreamFactory's logging features to capture script errors.
3. **Test incrementally**: Start with simple scripts and gradually add complexity.
4. **Use platform.api for debugging**: Make API calls within your script to test functionality.
5. **Monitor performance**: Be mindful of script execution time, especially for pre- and post-process scripts.

By mastering event scripts, you can extend DreamFactory's functionality and create powerful, customized API behaviors tailored to your specific needs.
