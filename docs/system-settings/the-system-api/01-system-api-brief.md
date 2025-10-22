---
sidebar_position: 1
title: Using the System APIs
id: using-the-system-apis
---

# Using the System APIs

DreamFactory is a **headless API platform**, meaning that everything you can do through the web-based administration console can also be accomplished programmatically through REST API calls. The administration console is essentially a frontend that makes calls to DreamFactory's System APIs behind the scenes.

All DreamFactory versions include a web-based administration console used to manage all aspects of the platform. While this console offers a user-friendly solution for performing tasks such as managing APIs, administrators, and business logic, many companies desire to instead automate management through scripting. There are two notable reasons for doing so:

## Multi-environment Administration

APIs should always be rigorously tested in a variety of test and QA environments prior to being deployed to production. While DreamFactory does offer a service export/import mechanism, it's often much more convenient to write custom scripts capable of automating multi-environment service creation.

## Integration with Third Party Services

The complexity associated with creating new SaaS products such as API monetization can be dramatically reduced thanks to the ability to integrate DreamFactory into the solution. Following payment, the SaaS could interact with DreamFactory to generate a new role-based access control, API key, and define a volume limit. The new API key could then be presented to the subscriber.

In this chapter we'll walk you through several examples explaining exactly how these two use cases can be achieved.

## Discovering API Calls Through the Browser

One of the most powerful ways to learn the System APIs is to observe what the DreamFactory administration console is doing behind the scenes. Every action you perform in the UI corresponds to specific API calls that you can replicate programmatically.

### Using Browser Developer Tools

To see the API calls that DreamFactory makes:

1. **Open Developer Tools**: Right-click anywhere in the DreamFactory admin console and select "Inspect" (or press `F12`)
2. **Navigate to Network Tab**: Click on the "Network" tab in the developer tools
3. **Filter for API Calls**: In the filter box, type `api/v2/system` to see only System API calls
4. **Perform Actions**: Use the admin console normally - create users, manage services, etc.
5. **Inspect Requests**: Click on any API call to see:
   - **Request URL**: The exact endpoint being called
   - **Request Method**: GET, POST, PUT, PATCH, DELETE
   - **Headers**: Including authentication tokens and content type
   - **Request Body**: JSON payload for POST/PUT requests
   - **Response**: The data returned by the API

### Example: Creating a User

When you create a user through the admin console, you'll see a call like this:

**Request:**
```
POST /api/v2/system/user
Headers:
  X-DreamFactory-Session-Token: your-session-token
  Content-Type: application/json
Body:
{
  "resource": [
    {
      "name": "john.doe",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "password": "securepassword"
    }
  ]
}
```

**Response:**
```json
{
  "resource": [
    {
      "id": 123,
      "name": "john.doe",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "is_active": true,
      "created_date": "2024-01-15 10:30:00"
    }
  ]
}
```

:::tip Pro Tip
Keep the Network tab open while exploring the admin console. You'll quickly learn the API patterns and can copy the exact requests to use in your own scripts or API testing tools like Postman.
:::

## General Notes on Making API Calls

As with the APIs that you create using DreamFactory, the system endpoints use the same authentication method, and thus will, at minimum require a session-token (if an admin), or a session-token together with an API-key (if a user). For users to be able to access the system endpoints, the appropriate permissions must be assigned as a role to that user.

### Session Tokens and API Keys

If you are the system admin, you will need to provide a session token with any call using the `X-DreamFactory-Session-Token` header. A user who has the permissions to create admins/users will need to also provide an API Key using the `X-DreamFactory-API-Key` header.

### Using Curl

The majority of the examples below will show the request type, along with the endpoint required. When using curl, you will want to use the following flags:

- `-X` for your request type (GET, POST etc.)
- `-H` for your headers, you will most likely use a combination of the following:
  - `-H "accept: application/json"`
  - `-H "Content-Type: application/json"` # For requests with a body
  - `-H "X-DreamFactory-Session-Token: <sessionToken>"`
  - `-H "X-DreamFactory-Api-Key: <sessionToken>"`
- `-d` for your json body when used.

## Common API Patterns

DreamFactory System APIs follow consistent patterns that make them easy to learn and use:

### Resource-Based URLs
Most System APIs follow the pattern: `/api/v2/system/{resource}`

- **Users**: `/api/v2/system/user`
- **Services**: `/api/v2/system/service`
- **Roles**: `/api/v2/system/role`
- **Apps**: `/api/v2/system/app`

### Standard HTTP Methods
- **GET**: Retrieve data (list or individual items)
- **POST**: Create new resources
- **PUT**: Update entire resources
- **PATCH**: Partial updates
- **DELETE**: Remove resources

### Common Query Parameters
- `?ids=123` - Get specific item by ID
- `?filter=field=value` - Filter results
- `?fields=name,email` - Return only specific fields
- `?related=role_by_role_id` - Include related data

### Example API Calls

Here are some common System API calls you'll see in the browser:

**List all users:**
```bash
GET /api/v2/system/user
```

**Get a specific user:**
```bash
GET /api/v2/system/user?ids=123
```

**Create a new service:**
```bash
POST /api/v2/system/service
Content-Type: application/json
{
  "resource": [
    {
      "name": "my-api",
      "label": "My API",
      "type": "mysql",
      "config": { ... }
    }
  ]
}
```

**Update a role:**
```bash
PATCH /api/v2/system/role?ids=456
Content-Type: application/json
{
  "resource": [
    {
      "name": "Updated Role Name"
    }
  ]
}
```

