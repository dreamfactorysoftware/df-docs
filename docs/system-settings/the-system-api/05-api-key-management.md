---
sidebar_position: 5
title: API Key Management
id: api-key-management
description: "Manage API keys programmatically via the System API and create bulk automation scripts for database fields"
keywords: [API key management, system API, app management, bulk actions, scripted services, automation]
difficulty: "advanced"
---

# API Key Management

It's possible to create and manage API keys via the system API. To retrieve a list of all API keys (known as Apps in DreamFactory lingo), send a GET request to the URI `/api/v2/system/app`.

## Retrieving API Keys

**Endpoint:** `GET /api/v2/system/app`

You'll receive a list of apps that look like this:

```json
{
  "id": 5,
  "name": "weatherappapi",
  "api_key": "API_KEY",
  "description": "weatherappapi",
  "is_active": true,
  "type": 0,
  "path": null,
  "url": null,
  "storage_service_id": null,
  "storage_container": null,
  "requires_fullscreen": false,
  "allow_fullscreen_toggle": true,
  "toggle_location": "top",
  "role_id": 2,
  "created_date": "2019-02-28 17:55:29",
  "last_modified_date": "2019-02-28 17:55:29",
  "created_by_id": "3",
  "last_modified_by_id": null,
  "launch_url": ""
}
```

To retrieve just the application name and associated API key, identify the desired fields using the fields parameter:

**Endpoint:** `GET /api/v2/system/app?fields=name,api_key`

Here's an example response. Note the `launch_url` attribute is always returned:

```json
{
  "resource": [
    {
      "name": "weatherappapi",
      "api_key": "API_KEY",
      "launch_url": ""
    },
    {
      "name": "HR Application",
      "api_key": "API_KEY",
      "launch_url": ""
    },
    {
      "name": "MySQL",
      "api_key": "API_KEY",
      "launch_url": ""
    }
  ]
}
```

You can also return each application's defined role using the related parameter. Issue a GET request to the following URI:

**Endpoint:** `GET /api/v2/system/app?related=role_by_role_id`

This will return a list of apps, and additionally any roles associated with the app. Note how in the following example a nested JSON object called `role_by_role_id` includes the role definition:

```json
{
  "id": 5,
  "name": "Weather Application API",
  "api_key": "API_KEY",
  "description": "Weather Application API",
  "is_active": true,
  "type": 0,
  "path": null,
  "url": null,
  "storage_service_id": null,
  "storage_container": null,
  "requires_fullscreen": false,
  "allow_fullscreen_toggle": true,
  "toggle_location": "top",
  "role_id": 2,
  "created_date": "2019-02-28 17:55:29",
  "last_modified_date": "2019-02-28 17:55:29",
  "created_by_id": "3",
  "last_modified_by_id": null,
  "launch_url": "",
  "role_by_role_id": {
    "id": 2,
    "name": "Weather App API Role",
    "description": "Role for Weather App API",
    "is_active": true,
    "created_date": "2019-02-28 17:54:56",
    "last_modified_date": "2019-02-28 17:54:56",
    "created_by_id": "3",
    "last_modified_by_id": null
  }
}
```

## Creating an App (API Key)

To create an App (API Key) via the system endpoint, you will want to make a POST call to:

**Endpoint:** `POST /api/v2/system/app`

**Request Body:**
```json
{
  "resource": [
    {
      "name": "<nameOfYourAPP>",
      "description": "<Description>",
      "type": 0,
      "role_id": null,
      "is_active": true
    }
  ]
}
```

:::info Default Role Assignment
You can add an id number of a role if you would like a default role for your application. A default role will mean that anyone can call services associated with that role's permissions without having to login to DreamFactory first (i.e., without a session token, with only the API Key).
:::

## Creating a Scripted Service to Perform Bulk Actions

There is a useful DreamFactory feature that allows the administrator to add a database function to a column so when that column is retrieved by the API, the function runs in its place. For instance, imagine if you want to change the format of the date field, you could use ORACLE's `TO_DATE()` function to do that:

```sql
TO_DATE({value}, 'DD-MON-YY HH.MI.SS AM')
```

DreamFactory can be configured to do this by adding `TO_DATE({value}, 'DD-MON-YY HH.MI.SS AM')` to the field's DB Function Use setting, which is found by going to the Schema tab, choosing a database, then choosing a table. Then click on one of the fields found in the fields section.

To perform this action at a service level, we can create a scripted service by going to Services -> Script -> And selecting a language of your choice. We will select PHP. The script below adds the database function to all the columns and allows us to performs this as a Bulk Action.

```php
$api = $platform['api'];
$get = $api->get;
$patch = $api->patch;
$options = [];
set_time_limit(800000);

// Get all tables URL. Replace the databaseservicename with your API namespace
$url = '<API_Namespace>/_table';

// Call parent API
$result = $get($url);
$fieldCount = 0;
$tableCount = 0;
$tablesNumber = 0;

// Check status code
if ($result['status_code'] == 200) {
    // If parent API call returns 200, call a MySQL API
    $tablesNumber = count($result['content']['resource']);

    // The next line is to limit number of tables to first 5 to see the successful run of the script
    //$result['content']['resource'] = array_slice($result['content']['resource'], 0, 5, true);

    foreach ($result['content']['resource'] as $table) {
        // Get all fields URL
        $url = "<API_Namespace>/_schema/" . $table['name'] . "?refresh=true";
        $result = $get($url);
         
        if ($result['status_code'] == 200) {
            $tableCount++;
            foreach ($result['content']['field'] as $field) {
                if (strpos($field['db_type'], 'date') !== false || strpos($field['db_type'], 'Date') !== false || strpos($field['db_type'], 'DATE') !== false) {
                    // Patch field URL
                    $fieldCount++;
                    $url = "<API_Namespace>/_schema/" . $table['name'] . "/_field";
                    
                    // Skip fields that already have the function
                    if ($field['db_function'][0]['function'] === "TO_DATE({value}, 'DD-MON-YY HH.MI.SS AM')") continue;
                    
                    // Remove broken function
                    $field['db_function'] = null;
                    $payload = ['resource' => [$field]];
                    $result = $patch($url, $payload);
                    
                    // Add correct function
                    $field['db_function'] = [['function' => "TO_DATE({value}, 'DD-MON-YY HH.MI.SS AM')", "use" => ["INSERT", "UPDATE"]]];
                    $payload = ['resource' => [$field]];
                    $result = $patch($url, $payload);
                    
                    if ($result['status_code'] == 200) {
                        echo("Function successfully added to " . $field['label'] . " field in " . $table['name'] . " table \n");
                        \Log::debug("Function successfully added to " . $field['label'] . " field in " . $table['name'] . " table");
                    } else {
                        $event['response'] = [
                            'status_code' => 500,
                            'content' => [
                                'success' => false,
                                'message' => "Could not add function to " . $field['label'] . " in " . $table['name'] . " table;"
                            ]
                        ];
                    }
                } 
            }
            \Log::debug("SCRIPT DEBUG: Total tables number " . $tablesNumber . " -> Tables  " . $tableCount . " fieldCount " . $fieldCount);
        } else {
            $event['response'] = [
                'status_code' => 500,
                'content' => [
                    'success' => false,
                    'message' => "Could not get all fields."
                ]
            ];
        }
    }
} else {
    $event['response'] = [
        'status_code' => 500,
        'content' => [
            'success' => false,
            'message' => "Could not get list of tables."
        ]
    ];
}

return "Script finished";
```

### Call the Service

From any REST client, make the request `GET /api/v2/apinamespace` and you should get a status 200. A simple REST client can be found at `<your_instance_url>/test_rest.html`. Remember if you are not an admin user your user role must allow access to the custom scripting service.
