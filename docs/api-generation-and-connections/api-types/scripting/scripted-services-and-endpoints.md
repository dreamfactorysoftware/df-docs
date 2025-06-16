---
sidebar_position: 1
title: Creating Scripted Services and Endpoints
id: scripted-services-and-endpoints
---

# Creating Scripted Services and Endpoints

DreamFactory allows you to create custom scripted services and endpoints using various scripting languages. This feature enables you to add business logic to your APIs and extend their functionality beyond standard REST operations.

## Overview

Scripted services in DreamFactory are standalone services that execute custom scripts written in supported scripting languages such as PHP, Python, Node.js, and JavaScript. These services can perform complex operations, integrate with external systems, and provide tailored API responses.

## Supported Scripting Languages

DreamFactory supports several scripting languages for creating scripted services:

- **Node.js**: Server-side JavaScript handler using the Node.js engine.
- **PHP**: Script handler using native PHP.
- **Python**: Script handler using native Python.
- **Python3**: Script handler using native Python3.

To get a list of the currently supported and configured scripts on a particular instance, use the API endpoint:

```
http://example.com/api/v2/system/script_type
```

## Creating a Scripted Service

To create a scripted service in DreamFactory, follow these steps:

1. **Navigate to API Generations & Connections**: In the DreamFactory WEB UI navigate to API Generation & Connections > Scripting and press the + button.
2. **Configure Service Details**: Enter the service name, label, and description.
3. **Choose Scripting Language**: Select the desired scripting language from the available options. (Node.js, PHP, Python3)
4. **Write the Script**: Enter your custom script in the provided editor.
5. **Save the Service**: Click "Save" to create the scripted service.

## Example: PHP Scripted Service

Here's an example of a simple PHP scripted service that returns a custom message:

```php
<?php
// Custom logic
$message = "Hello from DreamFactory Scripted Service!";

// Set response
$event['response']['content'] = [
    'success' => true,
    'message' => $message
];
?>
```

## Best Practices for Scripted Services

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

By leveraging scripted services, you can enhance the capabilities of your DreamFactory APIs and tailor them to meet specific business requirements.
