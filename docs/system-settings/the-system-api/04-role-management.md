---
sidebar_position: 4
title: Role Management
id: role-management
description: "Create and configure roles via the System API using verb masks to control API endpoint access permissions"
keywords: [role management, system API, verb mask, permissions, RBAC, access control, role assignment]
difficulty: "advanced"
---

# Role Management

After creating an API, you'll typically want to generate a role-based access control and API key. API-based role management is a tad complicated because it involves bit masks. The bit masks are defined as follows:

| Verb   | Mask |
|--------|------|
| GET    | 1    |
| POST   | 2    |
| PUT    | 4    |
| PATCH  | 8    |
| DELETE | 16   |

## Creating a Role

To create a role, you'll send a POST request to `/api/v2/system/role`, accompanied by a payload that looks like this:

**Endpoint:** `POST https://{url}/api/v2/system/role`

**Request Body:**
```json
{
  "resource": [
    {
      "name": "MySQL Role",
      "description": "MySQL Role",
      "is_active": true,
      "role_service_access_by_role_id": [
        {
          "service_id": SERVICE_ID,
          "component": "_table/employees/*",
          "verb_mask": 1,
          "requestor_mask": 3,
          "filters": [],
          "filter_op": "AND"
        },
        {
          "service_id": SERVICE_ID,
          "component": "_table/supplies/*",
          "verb_mask": 3,
          "requestor_mask": 3,
          "filters": [],
          "filter_op": "AND"
        }
      ],
      "user_to_app_to_role_by_role_id": []
    }
  ]
}
```

This payload assigns the role two permissions:

1. It can send GET requests to the `_table/employees/*` endpoint associated with the API identified by `SERVICE_ID`.
2. It can send GET and POST requests to the `_table/supplies/*` endpoint associated with the API identified by `SERVICE_ID`.

In the second case, the `verb_mask` was set to 3, because you'll add permission masks together to achieve the desired permission level. For instance GET (1) + POST (2) = 3. If you wanted to allow all verbs, you'll add all of the masks together 1 + 2 + 4 + 8 + 16 = 31. The `requestor_mask` was set to 3 because like the `verb_mask` it is represented by a bitmask. The value 1 represents API access whereas 2 represents access using DreamFactory's scripting syntax. Therefore a value of 3 ensures the endpoint is accessible via both an API endpoint and via the scripting environment.

:::info Bit Mask Reference
- **Verb Masks**: GET(1) + POST(2) + PUT(4) + PATCH(8) + DELETE(16) = 31 (all verbs)
- **Requestor Masks**: API(1) + Scripting(2) = 3 (both access methods)
:::

## Viewing a Role's Permissions

You can retrieve basic role information by contacting the `/system/role/` endpoint and passing along the role's ID. For instance to retrieve information about the role associated with ID 137 you'll query this endpoint:

**Endpoint:** `GET /api/v2/system/role/137`

This will return the following information:

```json
{
  "id": 137,
  "name": "Dashboard Application Role",
  "description": "Dashboard Application Role",
  "is_active": true,
  "created_date": "2020-04-06 17:56:00",
  "last_modified_date": "2020-04-06 18:10:31",
  "created_by_id": "1",
  "last_modified_by_id": "1"
}
```

However you'll often want to learn much more about a role, including notably what permissions have been assigned. To do so you'll need to join the `role_service_access_by_role_id` field:

**Endpoint:** `GET /api/v2/system/role/137?related=role_service_access_by_role_id`

This will return a detailed payload containing the assigned permissions, including each permission's service identifier, endpoint, verb mask, requestor mask, and any row-level filters (if applicable):

```json
{
  "id": 137,
  "name": "Dashboard Application Role",
  "description": "Dashboard Application Role",
  "is_active": true,
  "created_date": "2020-04-06 17:56:00",
  "last_modified_date": "2020-04-06 18:10:31",
  "created_by_id": "1",
  "last_modified_by_id": "1",
  "role_service_access_by_role_id": [
    {
      "id": 168,
      "role_id": 137,
      "service_id": 25,
      "component": "_table/customer/*",
      "verb_mask": 1,
      "requestor_mask": 1,
      "filters": [],
      "filter_op": "AND",
      "created_date": "2020-04-06 17:56:00",
      "last_modified_date": "2020-04-06 17:56:00",
      "created_by_id": null,
      "last_modified_by_id": null
    },
    {
      "id": 184,
      "role_id": 137,
      "service_id": 145,
      "component": "_table/account/*",
      "verb_mask": 1,
      "requestor_mask": 1,
      "filters": [],
      "filter_op": "AND",
      "created_date": "2020-04-07 14:39:38",
      "last_modified_date": "2020-04-07 14:39:38",
      "created_by_id": null,
      "last_modified_by_id": null
    }
  ]
}
```

## Updating an Existing Role

To add a new permission to an existing role, you'll the new role information along within the `role_services_access_by_role_id` JSON object. For instance, to add a new permission to the role identified by ID 137 you'll send a PUT request to this endpoint:

**Endpoint:** `PUT /api/v2/system/role/137`

The minimal JSON payload will look like this:

```json
{
  "id": 137,
  "role_service_access_by_role_id": [
    {
      "service_id": 25,
      "component": "_table/customer/*",
      "verb_mask": 1,
      "requestor_mask": 1,
      "filters": [],
      "filter_op": "AND"
    }
  ]
}
```

To delete an existing permission from an existing role, you'll set the `role_id` to null:

```json
{
  "id": 137,
  "role_service_access_by_role_id": [
    {
      "id": 168,
      "role_id": null
    }
  ]
}
```

## Assigning Roles to Users

Once you have your service, role, and app, you will most likely want to assign particular users to particular roles, giving them permission to call only what you want them to be able to, or indeed, want to be able to see what roles we have assigned to a particular user. To do so we will use the `user_to_app_to_role_by_user_id` relationship.

### Role Assignment

As an example let's say we want to assign user id 100 with a certain role for a certain app. If the role id is 7 and the app id is 4, the following would create the required relationship to assign that role to that user for that app.

**Endpoint:** `PUT /api/v2/system/user/100?related=user_to_app_to_role_by_user_id`

**Request Body:**
```json
{
  "user_to_app_to_role_by_user_id": [
    {
      "app_id": "4",
      "role_id": 7,
      "user_id": 100
    }
  ]
}
```

### Retrieving Role Assignments

To see what roles have been assigned to a user, do a GET with the relationship `user_to_app_to_role_by_user_id`. The last one is the one we just created above.

**Endpoint:** `GET /api/v2/system/user/100?related=user_to_app_to_role_by_user_id`

Will return something like the following:

```json
{
  "id": 100,
  "user_to_app_to_role_by_user_id": [
    {
      "id": 23,
      "user_id": 100,
      "app_id": 1,
      "role_id": 7
    },
    {
      "id": 24,
      "user_id": 100,
      "app_id": 2,
      "role_id": 7
    },
    {
      "id": 25,
      "user_id": 100,
      "app_id": 3,
      "role_id": 7
    },
    {
      "id": 26,
      "user_id": 100,
      "app_id": 4,
      "role_id": 7
    }
  ]
}
```
